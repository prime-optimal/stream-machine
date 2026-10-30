# Authenticated HTTP MCP

Implementation repository: https://github.com/prime-optimal/stream-machine

Integration issue: https://github.com/prime-optimal/stream-makeover/issues/51

Project: Stream Makeover Hackathon, prime-optimal Project 17. Labels: feature, phase:foundation, priority:p0.

## Endpoint

`/api/mcp` exposes the existing Open Design tool and resource definitions through MCP Streamable HTTP. Existing `od mcp` stdio clients keep their current interface. This endpoint is an administrative, single-tenant backend connection, not a public per-streamer account API.

Every request requires the daemon API token, even from loopback. Missing token configuration or disabled daemon API authentication leaves HTTP MCP unavailable. A session ID alone never authorizes a request.

Use the standard MCP initialization exchange, retain the returned `Mcp-Session-Id`, and use the same authenticated connection configuration for later POST, GET and DELETE requests. The SDK client manages these headers. Normal request responses use JSON; GET remains the MCP event-stream transport. DELETE closes a session.

Each session owns its brief drafts and plugin-workflow context. The default maximum is 64 sessions with 30-minute idle expiration; active tool requests are protected from idle expiration. Restarting the daemon drops transport sessions; clients must initialize again. Existing generation runs remain governed by the daemon's run lifecycle.

## Sealos

The inspected Sealos template already authenticates public clients with nginx Basic Auth, then injects the internal daemon bearer token for `/api/` requests. Placing MCP under `/api/mcp` uses that existing route.

Public endpoint after deployment:

`https://open-design-ssjzomvt.usw-1.sealos.app/api/mcp`

Supply the existing ingress credentials through the client's protected header configuration. Do not send the internal daemon token as a substitute for nginx authentication. Keep secrets in fnox/1Password and deployment secret storage, never repository files.

Verify the actual proxy configuration preserves MCP request/session headers. Check response buffering and timeouts if persistent event streams are needed. JSON responses avoid relying on a long-lived stream for ordinary tools.

## Stream Studio

The Studio browser calls its own backend. That backend verifies user and project ownership, then calls Open Design with server-held credentials. Do not expose this shared administrative endpoint's credentials to Studio visitors.

Server-to-server requests normally omit Origin. Browser-origin requests must pass existing daemon origin validation. An origin allowlist alone does not implement browser CORS or user authorization.

## Runtime distinction

HTTP MCP provides access to tools. Generation still requires an available authenticated agent runtime or explicitly selected configured provider. The optional Codex container layer is documented in [sealos-codex-runtime.md](sealos-codex-runtime.md).

## Acceptance

- Missing/wrong credentials rejected, including loopback callers.
- Disallowed browser origin rejected.
- SDK client initialization, tools/list and a project read succeed.
- Brief collection and confirmation survive multiple requests in one session.
- Briefs cannot be confirmed from another session.
- Session expiry, capacity, DELETE, aborted calls and shutdown clean up.
- Existing stdio client initialization and tool reads still work.
- Live deployment must independently pass authenticated initialization/list/read; local tests do not prove deployment.

No new model API key, user credential, or grant is created by enabling this transport. Cloud generation authentication is a separate acceptance step.
