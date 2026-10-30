# Plugin-local skill diagnostics

Issue: https://github.com/prime-optimal/stream-makeover/issues/56

`od.context.skills: [{"path":"./SKILL.md"}]` selects plugin-local instructions. Runtime prompt composition loads that file directly rather than registering it as a global skill. The generic registry resolver previously reported the valid local file as an unknown skill.

Doctor now uses the runtime's actual `loadPluginLocalSkill` implementation to distinguish loadable local instructions from unresolved references. Only successfully loaded local references are omitted from registry-warning diagnostics. Missing files, empty bodies, rejected traversal paths, bare global-style paths and explicit unknown global refs retain their existing warnings.

The original manifest and original context resolution still determine `freshDigest`. Diagnostic filtering neither changes snapshots nor silently changes a project's skill selection. Compatibility metadata or a staged asset is not a substitute for the local skill declaration.

Doctor is asynchronous because validation reads the same files as runtime composition. CLI folder validation and the HTTP doctor route await the report before returning it.

Focused regressions live in `apps/daemon/tests/plugins-doctor-local-skill.test.ts`. They cover loadable root/nested paths, loader-rejected content, matching local/global strings, warning opt-out, and unchanged digest references. Existing local-skill, folder-validator, GenUI, install/apply/snapshot and HTTP-route suites cover the adjacent boundaries.
