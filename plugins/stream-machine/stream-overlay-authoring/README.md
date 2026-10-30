# Stream Overlay Authoring · 0.1.0

Local-user OpenDesign scenario: add this folder to My plugins. Requires Node 24 for deterministic tools. No marketplace, account, private catalog or connector is required. Capabilities declare prompt injection, local read/write and subprocess execution for the builder/tests; no network access is needed.

- `SKILL.md` is the canonical agent workflow and approval/revision contract.
- `tools/build.cts` creates one offline, static overlay in a NEW directory.
- `runtime/overlay.cts` holds strict validation, geometry and adaptable layout seeds.
- `tests/overlay.test.cts` and `tests/fixtures/` travel with the package.
- `examples/camera-frame/index.html` has an empty transparent aperture.
- `examples/fullscreen-schedule/index.html` is a synthetic, full-canvas program.

Run from this folder:

```sh
node --test tests/overlay.test.cts
node tools/validate.cts
node tools/build.cts tests/fixtures/camera.json camera-v1
node tools/build.cts tests/fixtures/schedule.json schedule-v1
```

See references/inputs.md for every wired field, conditional behavior, calculated bounds, font provenance and live update API. Camera aperture defaults to auto and scales with dimensions; schedule ignores aperture and reports full opaque coverage without camera fields. See each generated README for OBS local-file setup. No animated mode is claimed: static compositions avoid an unnecessary animation dependency. No GSAP is bundled or needed.

All generic geometry is original. Defaults are explicitly chosen sample colors/copy, not measured brand inputs. No private logos, custom fonts or external images are included. Creator font rights remain with their owner; the builder embeds authorized fonts only in the relevant output.
