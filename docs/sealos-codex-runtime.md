# Sealos runtime with Codex

Issue: [stream-makeover#51](https://github.com/prime-optimal/stream-makeover/issues/51).
Implementation fork: [prime-optimal/stream-machine](https://github.com/prime-optimal/stream-machine).

## Image layers

`deploy/Dockerfile` builds Open Design, including the authenticated HTTP MCP endpoint. `deploy/Dockerfile.codex` adds pinned Codex CLI 0.166.0 to that image. Bun installs the official package in a separate build stage; the resulting image needs Node, not Bun, to launch the package. Codex's published Linux package contains a musl binary suitable for Alpine.

The extension adds Alpine's bubblewrap package, preserves the base image's entrypoint and command, and runs as UID/GID 1001, matching the existing Open Design image. It does not include login credentials, change sandbox mode, or disable authentication.

Build from the committed source root, after source verification:

```sh
docker build --platform linux/amd64 -f deploy/Dockerfile -t stream-machine:base .
docker build --platform linux/amd64 -f deploy/Dockerfile.codex \
  --build-arg OPEN_DESIGN_BASE_IMAGE=stream-machine:base \
  -t stream-machine:codex .
```

`linux/amd64` matches the inspected Sealos deployment. Use the actual deployment architecture when building elsewhere. Production publication should tag by commit and deploy the resulting image digest.

Optional Compose build override:

```sh
OPEN_DESIGN_BASE_IMAGE=stream-machine:base docker compose \
  -f deploy/docker-compose.yml -f deploy/docker-compose.codex.yml build
```

Compose remains optional on Sealos. Update the existing runtime workload's image; the template already owns ingress, proxy, service and persistent storage.

## Authentication and persistence

Read the root [daemon data directory contract](../AGENTS.md#daemon-data-directory-contract) before selecting or changing storage. Preserve the existing deployment's data root and volume. `CODEX_HOME` is an external-tool integration input, not another Open Design data root.

Before login, configure a writable, protected persistent Codex home appropriate to the deployment. The same effective `CODEX_HOME` and UID must be used for login, runtime detection and generation. A login performed as root into an unmounted home will not authenticate the non-root runtime and will disappear on replacement.

Choose one authentication mode:

- ChatGPT subscription: run `codex login --device-auth` in the container as the runtime user, then complete the displayed verification yourself. Confirm with `codex login status` under the same environment.
- API key: supply the key through fnox/1Password and the deployment secret mechanism. Pipe it to `codex login --with-api-key` through stdin if using persisted CLI authentication. Do not bake keys or auth files into the image, build args, Compose file or repository.

The Open Design web login does not authenticate Codex. CLI availability does not prove model access or an authenticated generation.

Leave `OD_CODEX_SANDBOX` unset initially. Only evaluate a broader mode after an actual sandbox failure is reproduced in the intended workload. Chromium/HyperFrames rendering prerequisites and memory capacity require separate verification; this layer adds Codex only.

## MCP and proxy

Public endpoint: `https://open-design-ssjzomvt.usw-1.sealos.app/api/mcp` after rollout.

The existing Sealos template protects the public endpoint with nginx Basic authentication and injects the daemon bearer token for `/api/` upstream requests. Preserve that arrangement. HTTP MCP clients need the public proxy credentials; an internal daemon token alone does not pass the public nginx gate. Verify protocol responses through ingress after deployment, including initialization, session header forwarding, tool listing, a harmless read and session deletion.

This endpoint controls one trusted Open Design instance. Stream Studio's backend must enforce creator ownership before forwarding requests. Do not give each streamer the shared administrative credential.

## Upgrade gate

The inspected live deployment reports Open Design 0.8.1; this worktree is based on 0.25.1 source. Replacing that image is an application upgrade, not only adding a transport file.

Before rollout:

1. Record current runtime/proxy image digests and deployment configuration without exporting secrets into Git.
2. Snapshot or copy the persistent data while writes are quiesced. Verify restoration procedure.
3. Test the new image against an isolated copy, including project listing and asset reads. Do not test migrations against the only live data copy.
4. Confirm Codex availability/authentication, complete one bounded generation and verify outputs survive a restart.
5. Keep the old image and compatible data backup available for rollback. An old binary may not understand data migrated by the new binary.
6. Roll out only after the implementation worktree is committed and required acceptance checks pass.

## Packaging verification

October 30, 2026: built `deploy/Dockerfile.codex` for Linux amd64 with `node:24-alpine` as a minimal smoke-test base. Build installed the official 0.166.0 package with Bun and successfully ran `codex --version` as UID/GID 1001. Codex app-server answered a real JSON-RPC initialize request with version 0.166.0 on Alpine x86_64 after a writable test home was created. Initial attempts with an unwritable or nonexistent home failed, confirming the need to prepare it before authentication.

The first app-server smoke reported missing system bubblewrap and fell back to its bundled binary. The image layer now installs Alpine's bubblewrap package. A repeated initialize with a writable non-temporary test home succeeded without home warnings, but reported that Linux sandboxing needs user-namespace access. This test does not prove sandboxed execution under Docker or Sealos. Configure protected persistent storage and test the real workload before choosing any sandbox override.

This smoke image is not an Open Design deployment image. Full daemon image, authenticated generation and live Sealos rollout remain separate acceptance steps.

References:

- [Official Codex source and Linux binary distribution](https://github.com/openai/codex)
- [Sealos Open Design deployment](https://sealos.io/products/app-store/open-design/)
- [Existing Open Design deployment guide](../deploy/README.md)
