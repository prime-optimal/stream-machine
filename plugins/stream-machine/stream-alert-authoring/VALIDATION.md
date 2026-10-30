# Validation record · audit revision

Executed in the selected hosted project on 2026-10-30 with Node v24.22.2.

## Regression-first evidence
Before fixes, the existing 16 checks passed and three new checks failed:
- Unknown inherited names were accepted (first failure: toString). Regressions
  now use JSON.parse inputs for toString, constructor and __proto__.
  This was a validation bypass, not demonstrated prototype pollution.
- Creator font CSS lacked the primary headline/name override across presets.
- Copy instructions and staged context omitted tests.

## Final commands and results
- `node generated-plugin/tools/build.cts generated-plugin/examples/generic.json generated-plugin/examples/index.html`
- `node generated-plugin/tools/build.cts generated-plugin/examples/editorial.json generated-plugin/examples/editorial.html`
  Both examples rebuilt from unchanged input JSON. Their system-font appearance
  and event contract are preserved; no font bytes are embedded in either example.
- `node --test generated-plugin/tests/*.test.cts`: 19 passed, zero failed.
  Covers payload bounds/Unicode, immutable snapshots, FIFO20, last100 dedupe,
  replay bypass, cancel/stale callbacks, font readiness, finite timeline and
  reduced motion endpoints, safe inline JSON, offline script compilation,
  two input sets, relocation, normal idle and synthetic preview interactions.
  New checks cover all three inherited names, creator font CSS in all presets,
  no font bytes leaking into defaults/examples, copied/staged tests and .cts files.
- `"$OD_NODE_BIN" "$OD_BIN" plugin validate ./generated-plugin --no-daemon`:
  ok=true, no issues.
- `"$OD_NODE_BIN" "$OD_BIN" plugin pack ./generated-plugin`:
  stream-alert-authoring@0.1.0 archive created beside the folder.

Seven owned modules are CommonJS TypeScript (.cts) with Node 24 native support.
The three browser runtime modules remain valid plain-JavaScript text when inlined;
compiled inline-script syntax and VM interaction tests pass. No guard exemption.
The native RAF clock is intentionally not HyperFrames-compatible; no GSAP or
HyperFrames rendering support is claimed. The earlier reference used a different
engine; only event-interface expectations are shared.

These are fresh Node/CLI checks, not actual browser or OBS checks. Creator font
browser acceptance is reserved for the parent. The synthetic font test uses
clearly labeled non-font bytes solely to verify embedding and CSS emission.
Inherited reference results were not relabeled as this package's results.
This authoring-run record predates parent acceptance. The parent subsequently
installed the scenario, generated two fresh outputs and accepted both in actual
browser and OBS testing. See [integration record](../../../docs/stream-scenarios-acceptance.md).
No OAuth or live Twitch delivery was tested.

Static review: no private font assets, remote runtime resources, unresolved
build placeholders, absolute authoring-project dependencies or fabricated
connector. Manifest preview/context/example paths exist. Files are below 500
lines. Optional guide and font provenance remain an output-specific obligation.
