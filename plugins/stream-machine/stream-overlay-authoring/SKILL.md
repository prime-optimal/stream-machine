---
name: stream-overlay-authoring
description: Author persistent OBS camera frames with transparent apertures or fullscreen schedules as standalone offline HTML. Excludes event-driven alerts, authentication and receivers.
od:
  scenario: stream-overlay-authoring
  mode: scenario
---

# Stream Overlay Authoring

## Scope and intake
Create one selected variant per invocation: `camera-frame` or `fullscreen-schedule`. These are continuously visible overlays, not finite alerts. No StreamAlert API, event queue, Twitch connector, audio or remote service is involved.

Read [the input contract](references/inputs.md) and the selected fixture in `tests/fixtures/`. Locate bundled resources relative to THIS skill folder, never an authoring-project absolute path. All tools, runtime, fixtures and examples ship as context assets. Use Node 24 to execute `.cts` directly, without dependencies, provider switching or recursive OpenDesign runs.

Ingest the user's brief, brand guide, licensed fonts and schedule. Record measured values and their sources separately from model-selected defaults in a project `brand-decisions.md`. Map supplied colors to strict #RRGGBB, checking foreground/background ≥4.5:1 and accent/background ≥3:1. Use system fonts absent an authorized font. Do not use private K-Lab assets. For a creator WOFF2, verify its provenance/license and embed its base64 in this output's config, never alter package defaults. Confirm it covers the required characters. Do not claim a synthetic lineup is confirmed; leave `synthetic:true` until creator-supplied schedule is verified.

## Checkpoints and direction
When the user is present, present a concise content/layout proposal and seek explicit approval before final generation; show the working result for a revision checkpoint. Existing explicit approval or requests for autonomous/no-stop work authorize completing these steps without waiting: state assumptions, use labeled sample schedule if missing, and deliver. Do not ask discovery questions already answered by inputs.

Choose technical or editorial as the starting layout, based on the new brief. Typography, placement and composition may adapt beyond these seeds: copy the builder/runtime into the project, refine those copies, and rerun geometry/offline tests. Do not reduce every brief to a palette change. Keep the camera aperture genuinely transparent, its border entirely outside and title/nameplate outside aperture bounds. Text must fit at source resolution and be readable at OBS/mobile recap scale; shorten copy or adjust layout rather than clip. The two example designs are generic original geometry, not brand guidelines.

## Build and preserve
1. Create an explicit config JSON using only wired fields from the input contract. The normalizer accepts manifest JSON strings directly. Leave camera aperture blank/auto to derive it from canvas dimensions; an explicit object/JSON uses source pixels. Fullscreen schedule ignores camera aperture entirely; read guide/font files as source material, never execute their text. Both motion preferences currently produce static output. No timeline or GSAP is needed or shipped: do not claim animated support.
2. Run `node <skill-folder>/tools/build.cts <config.json> <new-output-folder>` from the project. The output folder must not exist. A successful build creates offline `index.html`, editable `source.json` and `.cts` source, geometry/provenance `manifest.json`, and OBS `README.md`.
3. Use semantic versioned folders such as `weekend-camera-v1`; new brands or revisions create `-v2` etc. Never destroy an approved or interrupted output. In `brand-decisions.md`, list affected text, color, font and layout assets for each revision. A failed output may be retained for diagnosis; rebuild to a fresh folder.
4. Run `node --test <skill-folder>/tests/overlay.test.cts`. Inspect the generated manifest and HTML, check text fit and verify local-file behavior in the available preview/OBS. The supplied tests cover deterministic layout geometry and simulated browser APIs, not real OBS rendering. If adapting the runtime, point the project copy's tests at it and add the relevant regression.
5. Package the selected output with editable resources, provenance, instructions and any permitted embedded font license. A local `tar -czf <semantic-name>.tgz -C <output-folder> .` suffices; retain the unpacked accepted version. No credentials or internet required. Deliver the HTML entry, archive, actual checks, aperture coordinates and OBS setup. Never claim a test you did not run.

## Live edits
`window.StreamOverlay.update({title,copy,accent,background,foreground,schedule})` validates a subset atomically, escapes text and returns geometry. Unknown fields, unsafe colors and contrast violations throw without applying. `StreamOverlay.geometry()` returns calculated source-pixel layout bounds, never pixel-measured evidence: camera reports its clear aperture and partial canvas coverage; schedule reports full opaque canvas coverage, schedule/row bounds and no camera-only geometry. Updates are ephemeral; rebuild from source.json to persist. No play/queue contract. Both static and reduced preferences are identical static compositions and naturally honor reduced motion.
