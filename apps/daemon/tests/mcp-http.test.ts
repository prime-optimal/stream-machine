import express from 'express';
import type { Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerHttpMcpRoutes } from '../src/mcp-http.js';

const token = 'test-only-http-mcp-token';
const headers = { authorization: `Bearer ${token}` };
const cleanup: Array<() => Promise<void>> = [];

afterEach(async () => {
  for (const close of cleanup.reverse()) await close();
  cleanup.length = 0;
});

async function harness(options: {
  env?: NodeJS.ProcessEnv;
  maxSessions?: number;
  idleMs?: number;
  now?: () => number;
  projects?: () => Promise<void>;
} = {}) {
  const app = express();
  app.use(express.json());
  let port = 0;
  app.post('/api/analytics/mcp/context', (_req, res) => res.json({ enabled: false }));
  app.get('/api/workspaces/context', (_req, res) => res.status(404).end());
  app.get('/api/projects', async (_req, res) => {
    await options.projects?.();
    res.json({ projects: [{ id: 'example', name: 'Example' }] });
  });
  const lifecycle = registerHttpMcpRoutes(app, {
    daemonUrl: () => `http://127.0.0.1:${port}`,
    port: () => port,
    env: options.env ?? { OD_API_TOKEN: token },
    ...(options.maxSessions === undefined ? {} : { maxSessions: options.maxSessions }),
    ...(options.idleMs === undefined ? {} : { idleMs: options.idleMs }),
    ...(options.now === undefined ? {} : { now: options.now }),
  });
  const server = await new Promise<HttpServer>((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  port = (server.address() as AddressInfo).port;
  const url = new URL(`http://127.0.0.1:${port}/api/mcp`);
  cleanup.push(async () => {
    await lifecycle.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  async function client() {
    const transport = new StreamableHTTPClientTransport(url, { requestInit: { headers } });
    const client = new Client({ name: 'http-mcp-test', version: '1.0.0' });
    await client.connect(transport as Transport);
    cleanup.push(() => client.close());
    return { client, transport };
  }
  return { url, client, lifecycle };
}

function initialize(id = 1) {
  return { jsonrpc: '2.0', id, method: 'initialize', params: {
    protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' },
  } };
}

async function post(url: URL, body: unknown, extra: Record<string, string> = {}) {
  return fetch(url, {
    method: 'POST',
    headers: { ...headers, accept: 'application/json, text/event-stream', 'content-type': 'application/json', ...extra },
    body: JSON.stringify(body),
  });
}

describe('authenticated HTTP MCP', () => {
  it('rejects anonymous and wrong-token requests, including loopback', async () => {
    const { url } = await harness();
    for (const method of ['GET', 'POST', 'DELETE']) {
      expect((await fetch(url, { method })).status).toBe(401);
      expect((await fetch(url, { method, headers: { authorization: 'Bearer wrong' } })).status).toBe(401);
    }
  });

  it.each([{}, { OD_API_TOKEN: token, OD_DISABLE_API_AUTH: '1' }])(
    'fails closed when token authentication is not configured: %j', async (env) => {
      const { url } = await harness({ env });
      expect((await post(url, initialize())).status).toBe(503);
    },
  );

  it('initializes a real SDK client, lists existing tools and calls an existing read tool', async () => {
    const { client, url } = await harness();
    const connected = await client();
    const tools = await connected.client.listTools();
    expect(tools.tools.some((tool) => tool.name === 'get_file')).toBe(true);
    expect(tools.tools.some((tool) => tool.name === 'start_run')).toBe(true);
    const projects = await connected.client.callTool({ name: 'list_projects', arguments: {} });
    expect(JSON.stringify(projects)).toContain('Example');
    expect(connected.transport.sessionId).toBeTruthy();
    const sessionId = connected.transport.sessionId!;
    await connected.transport.terminateSession();
    const stale = await post(url, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, { 'mcp-session-id': sessionId });
    expect(stale.status).toBe(404);
  });

  it('keeps brief state across requests and isolates it between sessions', async () => {
    const { client } = await harness();
    const first = await client();
    const second = await client();
    const brief = await first.client.callTool({ name: 'collect_brief', arguments: { artifactType: 'website', locale: 'en' } });
    const data = brief.structuredContent as Record<string, unknown>;
    const form = data.questionForm as { questions: Array<{ id: string; defaultValue: string }> };
    const answers = Object.fromEntries(form.questions.map((question) => [question.id, question.defaultValue]));
    const args = { briefDraftId: data.briefDraftId, nonce: data.nonce, answers };
    const foreign = await second.client.callTool({ name: 'confirm_brief', arguments: args });
    expect(foreign.isError).toBe(true);
    const own = await first.client.callTool({ name: 'confirm_brief', arguments: args });
    expect(own.isError, JSON.stringify(own)).not.toBe(true);
  });

  it('rejects foreign origins, including a stolen valid session ID', async () => {
    const { url, client } = await harness();
    const connected = await client();
    const result = await post(url, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, {
      'mcp-session-id': connected.transport.sessionId!, origin: 'https://evil.example',
    });
    expect(result.status).toBe(403);
    expect((await post(url, initialize(), { origin: 'null' })).status).toBe(403);
  });

  it('accepts an explicitly allowed origin with valid authentication', async () => {
    const { url } = await harness({ env: { OD_API_TOKEN: token, OD_ALLOWED_ORIGINS: 'https://studio.example' } });
    expect((await post(url, initialize(), { origin: 'https://studio.example' })).status).toBe(200);
  });

  it('bounds sessions, expires idle sessions, and rejects expired IDs', async () => {
    let now = 0;
    const { url, client } = await harness({ maxSessions: 1, idleMs: 100, now: () => now });
    const connected = await client();
    expect((await post(url, initialize())).status).toBe(503);
    now = 101;
    const expired = await post(url, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, { 'mcp-session-id': connected.transport.sessionId! });
    expect(expired.status).toBe(404);
    expect((await post(url, initialize())).status).toBe(200);
  });

  it('does not consume capacity for failed initialization or accept client-chosen sessions', async () => {
    const { url } = await harness({ maxSessions: 1 });
    expect((await post(url, initialize(), { 'mcp-session-id': 'chosen-by-client' })).status).toBe(404);
    expect((await post(url, initialize(), { accept: 'application/json' })).status).toBe(406);
    expect((await post(url, initialize())).status).toBe(200);
  });

  it('reserves capacity before concurrent initialization completes', async () => {
    const { url } = await harness({ maxSessions: 1 });
    const results = await Promise.all([post(url, initialize(1)), post(url, initialize(2))]);
    expect(results.map((result) => result.status).sort()).toEqual([200, 503]);
  });

  it('does not expire a session while its tool call is running', async () => {
    let now = 0;
    let entered!: () => void;
    let release!: () => void;
    const reached = new Promise<void>((resolve) => { entered = resolve; });
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const { url, client } = await harness({
      maxSessions: 1, idleMs: 100, now: () => now,
      projects: async () => { entered(); await waiting; },
    });
    const connected = await client();
    const pending = connected.client.callTool({ name: 'list_projects', arguments: {} });
    try {
      await reached;
      now = 101;
      expect((await post(url, initialize())).status).toBe(503);
    } finally {
      release();
    }
    expect((await pending).isError).not.toBe(true);
    now = 202;
    expect((await post(url, initialize())).status).toBe(200);
  });

  it('closes sessions on shutdown and refuses new sessions', async () => {
    const { url, client, lifecycle } = await harness();
    await client();
    await lifecycle.close();
    expect((await post(url, initialize())).status).toBe(503);
  });

  it.each(['shutdown', 'delete'])('settles active HTTP calls when a session closes via %s', async (mode) => {
    let entered!: () => void;
    let release!: () => void;
    const reached = new Promise<void>((resolve) => { entered = resolve; });
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const { client, lifecycle } = await harness({ projects: async () => { entered(); await waiting; } });
    const connected = await client();
    const result = connected.client.callTool({ name: 'list_projects', arguments: {} })
      .then(() => 'succeeded', () => 'closed');
    try {
      await reached;
      if (mode === 'shutdown') await lifecycle.close();
      else await connected.transport.terminateSession();
      expect(await Promise.race([result, new Promise((resolve) => setTimeout(() => resolve('hung'), 350))])).toBe('closed');
    } finally {
      release();
    }
  });

  it('reclaims a session when a client aborts a blocked tool request', async () => {
    let entered!: () => void;
    let release!: () => void;
    const reached = new Promise<void>((resolve) => { entered = resolve; });
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const { url, client } = await harness({
      maxSessions: 1, projects: async () => { entered(); await waiting; },
    });
    const connected = await client();
    const controller = new AbortController();
    const pending = fetch(url, {
      method: 'POST', signal: controller.signal,
      headers: { ...headers, accept: 'application/json, text/event-stream', 'content-type': 'application/json',
        'mcp-session-id': connected.transport.sessionId! },
      body: JSON.stringify({ jsonrpc: '2.0', id: 100, method: 'tools/call', params: { name: 'list_projects', arguments: {} } }),
    }).then(() => 'completed', () => 'aborted');
    try {
      await reached;
      controller.abort();
      expect(await pending).toBe('aborted');
      await vi.waitFor(async () => expect((await post(url, initialize())).status).toBe(200));
    } finally {
      release();
    }
  });
});
