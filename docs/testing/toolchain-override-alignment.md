# Toolchain and override alignment

October 30, 2026. Tracks prime-optimal/stream-makeover issue61.

The existing local mise edit adds `codex = "latest"`; it resolves the already
installed Codex0.166.0 at verification. Node24 and pnpm10.33.2 remain unchanged.

The pending lockfile was not a standalone dependency update. Duplicate override
declarations disagreed: package.json and the fork's committed lock used newer
brace-expansion, fast-uri, hono and ip-address versions, while workspace YAML
selected older versions. The old checkout's lock also predated the fork's stable
Vela0.1.8 correction. Copying it would revert those choices.

Workspace overrides now match all13 existing package.json/lock entries, including
tar and both undici ranges. The committed lock already describes the intended
dependency graph and needs no change. The original pending lock/config files
were backed up locally before reconciliation.

Validation:

- Configuration consistency: seven mismatches before alignment; all13 overrides
  agree afterward. Tool pins, Node engine and build allowlists agree.
- `bun install --ignore-scripts --frozen-lockfile` succeeds in the isolated
  worktree with its own node_modules. Lockfile bytes remain unchanged.
- Workspace prerequisite builds, `bun run guard`, full `bun run typecheck` and
  `git diff --check` pass.

No upstream push, global tool change, cloud deployment or credential change.
