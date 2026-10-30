# Stream Alert Authoring · 0.1.0

A local OpenDesign scenario for safe, creator-specific follower alerts. No runtime
npm dependencies, private fonts, remote scripts or Twitch connector are included.

## Install and use
From the folder's parent, using the installed OpenDesign CLI:

```sh
od plugin validate ./generated-plugin --no-daemon
od plugin pack ./generated-plugin
od plugin install ./generated-plugin
od plugin doctor stream-alert-authoring
```

In hosted environments replace `od` with `"$OD_NODE_BIN" "$OD_BIN"`.
Alternatively add this folder through **My plugins**. The installed package produced
two fresh outputs accepted in browser and OBS; see the integration record below.
The subprocess capability executes the
local deterministic builder/tests; no network or connector capability is needed.
If a restricted install requests grants, use the actual capability review rather
than marketplace publishing or enterprise setup.

Select the scenario in OpenDesign, fill creator inputs, and request an alert.
For headless use (replace PROJECT_ID with your actual project):

```sh
od plugin apply stream-alert-authoring --project PROJECT_ID --input brandName="My stream"
od plugin run stream-alert-authoring --project PROJECT_ID --inputs '{"brandName":"My stream"}' --follow
```

## Deterministic local example
Requires Node 24 (native `.cts` support); no dependency installation:

```sh
node generated-plugin/tools/build.cts generated-plugin/examples/generic.json index.html
node --test generated-plugin/tests/*.test.cts
```

Open examples/preview.html for a labeled one-shot synthetic demonstration. Open
examples/index.html without a query to verify idle. For OBS choose Browser Source,
Local File, index.html and 960 × 320 (or resolved dimensions). The file contains
its full runtime. Replay/cancel controls exist only in `?preview=1` mode. A normal
file intentionally appears empty until StreamAlert.play receives a valid event.

## Inputs
All manifest inputs enter the query. Text fields populate the corresponding
visible labels; sampleFollower supplies the preview event; width/height control
the canvas; duration controls the whole lifecycle; colors control panel/ink with
contrast validation; styleDirection changes geometry and typography. Font files
are embedded per output. Brand guides require agent review and source/config
changes, documented in provenance; they are never silently ignored by the CLI.
Text bounds: brand 32, event/headline 40, footer/sample name 64 Unicode codepoints.
Custom visuals should be checked at the minimum supported 480 × 240 canvas.

Authoring modules are under src/; build.cts resolves resources from its own
location, not the caller's cwd. Copy the entire folder to relocate it. Final
exports need only index.html. Generated output source/config should accompany
handoff for revision. Native requestAnimationFrame is used instead of GSAP;
there is no third-party animation library or omitted GSAP license notice.
The native RAF clock is intentionally not HyperFrames-compatible and supplies no
GSAP/HyperFrames rendering integration. The reference used a different engine;
only event-interface expectations are shared. All seven owned source, builder
and test modules are CommonJS `.cts`; browser modules remain plain-JS text.
Copy tests, complete examples and metadata with source when creating authoring/;
the manifest stages all of these resources.

See docs/transport.md, docs/provenance.md and contracts/. Actual validation is
recorded in VALIDATION.md and [the integration record](../../../docs/stream-scenarios-acceptance.md).
The latest canonical-skill manifest correction has passed the platform loader
test locally; its hosted reinstall remains pending. No live Twitch delivery is claimed.
