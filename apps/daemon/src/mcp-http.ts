import { randomUUID } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { apiTokenAuthorizationMatches, apiTokenFromEnv, isApiAuthDisabled } from './api-token-auth.js';
import { createMcpServer } from './mcp.js';
import { allowedBrowserPorts, configuredAllowedOrigins, isAllowedBrowserOrigin } from './origin-validation.js';

interface HttpMcpOptions {
  daemonUrl: () => string;
  port: () => number;
  env?: NodeJS.ProcessEnv;
  maxSessions?: number;
  idleMs?: number;
  now?: () => number;
}

interface Session {
  server: Server;
  transport: StreamableHTTPServerTransport;
  initialized: boolean;
  lastUsed: number;
  activePosts: number;
  responses: Set<Response>;
}

function reject(res: Response, status: number, message: string) {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });
}

export function registerHttpMcpRoutes(app: Express, options: HttpMcpOptions) {
  const env = options.env ?? process.env;
  const now = options.now ?? Date.now;
  const maxSessions = options.maxSessions ?? 64;
  const idleMs = options.idleMs ?? 30 * 60_000;
  if (!Number.isInteger(maxSessions) || maxSessions < 1 || !Number.isFinite(idleMs) || idleMs < 1) {
    throw new Error('HTTP MCP session limits must be positive');
  }
  const sessions = new Map<string, Session>();
  let closed = false;

  function closeResponses(session: Session) {
    for (const response of session.responses) {
      if (response.destroyed || response.writableEnded) continue;
      if (!response.headersSent) reject(response, 503, 'MCP session closed');
      else response.end();
    }
    session.responses.clear();
  }

  async function remove(id: string) {
    const session = sessions.get(id);
    if (!session) return;
    sessions.delete(id);
    closeResponses(session);
    await session.server.close().catch(() => {});
  }

  async function expire() {
    await Promise.all([...sessions].filter(([, session]) =>
      session.activePosts === 0 && now() - session.lastUsed >= idleMs,
    ).map(([id]) => remove(id)));
  }

  const timer = setInterval(() => { void expire(); }, Math.min(idleMs, 60_000));
  timer.unref();

  async function handle(req: Request, res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    const token = apiTokenFromEnv(env);
    if (closed || !token || isApiAuthDisabled(env)) {
      reject(res, 503, 'HTTP MCP requires enabled API token authentication');
      return;
    }
    if (!apiTokenAuthorizationMatches(req.get('authorization'), token)) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="OpenDesign MCP"');
      reject(res, 401, 'Authentication required');
      return;
    }
    const origin = req.get('origin');
    if (origin !== undefined && !isAllowedBrowserOrigin(
      origin, req.headers.host, allowedBrowserPorts(options.port(), env),
      env.OD_BIND_HOST || '127.0.0.1', configuredAllowedOrigins(env),
    )) {
      reject(res, 403, 'Origin is not allowed');
      return;
    }
    if (!['POST', 'GET', 'DELETE'].includes(req.method)) {
      res.setHeader('Allow', 'POST, GET, DELETE');
      reject(res, 405, 'Method not allowed');
      return;
    }
    await expire();
    if (closed) {
      reject(res, 503, 'HTTP MCP is shutting down');
      return;
    }
    const requestedId = req.get('mcp-session-id');
    let id = requestedId;
    let session = id ? sessions.get(id) : undefined;
    if (id && (!session || !session.initialized)) {
      reject(res, 404, 'Session not found');
      return;
    }
    if (!id) {
      if (req.method !== 'POST' || !isInitializeRequest(req.body)) {
        reject(res, 400, 'Initialize a session first');
        return;
      }
      if (sessions.size >= maxSessions) {
        res.setHeader('Retry-After', '60');
        reject(res, 503, 'HTTP MCP session capacity reached');
        return;
      }
      id = randomUUID();
      const reservedId = id;
      const server = createMcpServer({ daemonUrl: options.daemonUrl() });
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => reservedId,
        enableJsonResponse: true,
        onsessioninitialized: () => {
          const current = sessions.get(reservedId);
          if (current) current.initialized = true;
        },
      });
      session = { server, transport, initialized: false, lastUsed: now(), activePosts: 0, responses: new Set() };
      sessions.set(id, session);
      try {
        await server.connect(transport as Transport);
        if (closed) {
          await remove(id);
          await server.close();
          reject(res, 503, 'HTTP MCP is shutting down');
          return;
        }
        const sdkOnClose = transport.onclose;
        transport.onclose = () => {
          const current = sessions.get(reservedId);
          sessions.delete(reservedId);
          if (current) closeResponses(current);
          sdkOnClose?.();
        };
      } catch {
        await remove(id);
        reject(res, 500, 'Unable to initialize MCP session');
        return;
      }
    }
    if (!session || !id) return;
    session.lastUsed = now();
    if (req.method === 'POST') session.activePosts++;
    if (req.method !== 'DELETE') session.responses.add(res);
    const activeSession = session;
    const activeId = id;
    let finished!: () => void;
    const responseClosed = new Promise<void>((resolve) => { finished = resolve; });
    const onResponseClose = () => {
      activeSession.responses.delete(res);
      if (req.method === 'POST' && !res.writableFinished) void remove(activeId);
      finished();
    };
    res.once('close', onResponseClose);
    try {
      await Promise.race([session.transport.handleRequest(req, res, req.body), responseClosed]);
    } catch {
      await remove(id);
      if (!res.headersSent) reject(res, 500, 'MCP request failed');
      else res.end();
    } finally {
      res.removeListener('close', onResponseClose);
      session.responses.delete(res);
      if (req.method === 'POST') session.activePosts--;
      session.lastUsed = now();
      if (!session.initialized || req.method === 'DELETE' || (!requestedId && res.statusCode >= 400)) await remove(id);
    }
  }

  app.all('/api/mcp', handle);
  return {
    async close() {
      closed = true;
      clearInterval(timer);
      await Promise.all([...sessions.keys()].map(remove));
    },
  };
}
