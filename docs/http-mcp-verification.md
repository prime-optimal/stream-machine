# HTTP MCP deployment verification

October 30, 2026. Integration issue: prime-optimal/stream-makeover#51. PR: https://github.com/prime-optimal/stream-machine/pull/1.

## Deployed

- Public endpoint: `https://open-design-ssjzomvt.usw-1.sealos.app/api/mcp`.
- Implementation commit: `5c79038d7cd2f3dd667028e5382f1a93672b5c57`.
- Image: `harbor.usw-1.sealos.io/ns-sjkkuwc0/stream-machine@sha256:a3aa28203c12996188a2e9ad9037392e1207e719ef33a708abaa8ed7dfc0b50b`.
- Open Design reports 0.25.1. Installed Codex reports 0.166.0.
- StatefulSet `open-design-vflpam` completed rollout; pod ready with zero restarts at verification.
- Existing nginx Basic authentication and internal bearer injection retained. Resource limits remain 100m CPU / 256 MiB memory.
- Runtime data root explicitly matches the existing persistent workspace; Codex home is a writable child of that root. The existing sandbox setting was preserved, not introduced by this change.

## Acceptance results

| Check | Result |
| --- | --- |
| Public MCP initialize | 200, session established |
| Public tools/list | 200, 22 tools |
| Public list_projects tool | 200, successful structured result |
| Public list_agents tool | 200, successful structured result |
| Public DELETE session | 200 |
| Anonymous POST | 401 |
| Installed cloud Codex binary | 0.166.0 |
| Cloud Codex login | Device authorization completed; login status confirms ChatGPT |
| Cloud model call | Codex exec returned exactly `CLOUD_CODEX_OK`, exit 0 |

The same MCP protocol checks passed against the built Linux container before deployment. Existing local stdio MCP registration was separately verified through initialization, tool discovery, reading the existing overlay project's README, and local Codex discovery.

## Tests and build

- 15 HTTP protocol/lifecycle tests using real MCP SDK clients.
- 54 tests across six focused suites passed: HTTP, stdio idle, fatal errors, fatal wiring, file read, observability.
- Source/test TypeScript and full workspace typecheck passed.
- Repository guard and whitespace checks passed.
- Full Linux amd64 application image and Codex layer built successfully.
- A real container build reproduced host dependency contamination: nested aube compiler shims overwrote Linux pnpm binaries. Recursive Docker exclusions fix the context; release image built from committed `git archive` input.
- Independent Codex layer app-server initialization passed as UID 1001 with writable home. After device authorization, a live cloud Codex call using its default model returned the exact requested marker. That test requested no tool calls or file edits; it proves authenticated inference, not sandboxed execution or asset generation.

Focused test command used from `apps/daemon`:

```sh
bun x vitest run -c /tmp/open-design-http-mcp-regression.config.mjs
```

Temporary config selected `tests/mcp-http.test.ts`, `tests/mcp-stdio-idle.test.ts`, `tests/mcp-fatal-errors.test.ts`, `tests/mcp-fatal-wiring.test.ts`, `tests/mcp-get-file.test.ts`, and `tests/mcp-observability.test.ts`, with Node environment, serial files, 20-second timeout and no setup files. Normal repository test configuration also discovers these committed suites after its dependency build prerequisites are met.

## Upgrade and rollback evidence

Deployment manifests and proxy configuration were backed up privately outside Git. A consistent SQLite backup and workspace archive were saved in `/Users/prime/.local/state/stream-studio/sealos-backups/2026-10-30-http-mcp/`, with restrictive permissions.

Before deployment, the new image booted against a copy of that workspace with networking disabled. SQLite quick_check returned ok, and project count remained zero. Both fresh and copied-data containers stayed within the existing 256 MiB memory cap.

Rollback must use the saved workload configuration and, if schema rollback is required, the consistent database/workspace backup. Changing only the image is not a guaranteed database rollback. Keep the backup private because it can contain runtime credentials.

## Remaining boundaries

- Verify an actual Open Design artifact generation and its tool/file execution separately. Device sign-in initially failed because the ChatGPT account's device-code authorization setting was disabled; the account holder enabled it and completed login.
- Stream Studio has not yet been wired to this endpoint. Its backend must enforce user/project ownership and keep Open Design administrative credentials server-side.
- This is a single-tenant administrative MCP endpoint, not public per-streamer authentication or an OAuth registration service.
- No Twitch event delivery or social publishing was added in this task.

## 1Password prompts

1Password CLI authorization is per terminal session. It expires after 10 minutes idle and has a 12-hour maximum; locking the app revokes prior authorization. An unlocked app therefore does not authorize every new CLI session. A persistent terminal can reduce repeated approvals. For unattended services, use a narrowly scoped service account rather than disabling personal vault protections.

The specific recent change on this machine was not diagnosed. Source: https://www.1password.dev/cli/app-integration-security
