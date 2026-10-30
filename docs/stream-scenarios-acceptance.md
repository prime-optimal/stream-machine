# Stream scenarios: integration record

2026-10-30. Tracking: prime-optimal/stream-makeover issue 53.

## Scope

Two local Open Design packages live under `plugins/stream-machine/`:

| Package | Contract | Current acceptance |
| --- | --- | --- |
| stream-alert-authoring | Offline HTML; finite event animation, queue, replay, cancel, transparent idle | Two fresh installed-scenario outputs accepted in browser and OBS |
| stream-overlay-authoring | Offline HTML; persistent camera frame or full-screen schedule | Two fresh installed-scenario outputs accepted in browser and OBS; nine package tests passed |

The alert package uses native requestAnimationFrame. It does not implement
HyperFrames seeking. The earlier K-Lab pilot uses GSAP and a registered timeline;
its acceptance does not substitute for scenario acceptance. Both overlay variants
are static. No Twitch OAuth, EventSub delivery or production alert adapter is
included or claimed by these packages.

## Fresh alert runs

Both invocations used the installed scenario through hosted Open Design + Codex.
Private K-Lab fonts belong only to the private fixture, never package defaults.

| Fixture | Cloud run | Export SHA-256 |
| --- | --- | --- |
| K-Lab Halloween; 960×320; six seconds; supplied creator font | d084b925-d10e-47af-9817-b0b6a6b023db | 505108f9b9bd606effbfe1bdf405ad8cf876dbcf2268eda1f69053ca1fb0ab56 |
| Night Arcade; 800×300; four seconds; system fonts | 7a01f150-0426-4551-9245-251da9b41167 | b7ec2efc062861249919dd16436de3738d30ff2463db057fa5a8e9df7d725006 |

K-Lab browser assertions: 61 normal, 61 half-size, 62 reduced-motion fixture.
Arcade: 65 normal, 65 half-size, 66 reduced-motion fixture. Actual font loading,
safe text, lifecycle and distinct styling were checked. Reduced-motion fixtures
exercise the branch; they do not prove OS preference propagation.

Each output passed 16 checks in the running OBS-Studio-Rust instance. Original
exports were idle and transparent. Explicit synthetic fixtures invoked the public
alert API after font readiness; their six/four-second lifecycles returned to
transparent idle. Source exports remained unchanged. Original scene/items were
restored; broadcasts remained stopped. This proves OBS-Studio-Rust integration,
not a separate test of every OBS distribution or real Twitch event delivery.

Evidence remains in the private stream-makeover repository under
`docs/qa/scenarios/`, including screenshots, browser assertions, input provenance
and OBS reports. It intentionally contains private creator materials.

## Canonical skill context

Both manifests declare `od.context.skills: [{"path":"./SKILL.md"}]`.
`compat.agentSkills` alone does not inject the canonical skill body. The new
daemon integration test calls `loadPluginLocalSkill` for both real packages and
checks that the complete workflow body is loaded.

The alert correction is verified locally and reinstalled in the hosted instance.
The accepted alert runs used the earlier installed manifest and read
the staged skill file. The overlay correction was installed before the outage.
The hosted image still reports an incorrect unresolved-global-skill warning for
valid local paths. Source fix PR3 is merged; the running image has not been
redeployed with it. Keep the valid local path rather than removing workflow
context to suppress a warning.

## Fresh overlay acceptance

| Fixture | Cloud run | Export SHA-256 | Browser / OBS checks |
| --- | --- | --- | --- |
| K-Lab Halloween camera; 1280×720; supplied WOFF2 | 3c8decdb-5ea2-41c8-9053-054bf2b504fd | e1b1e904e35c1da5a266fdb193c568f1d05c29e42adfa1cf08ee0a2037535a4f | 31 / 11 |
| Night Arcade schedule; 1280×720; six rows; system fonts | 340133e0-3985-4147-8ac8-b7702073597c | a45f097539221aac2a623ff56fc06acc5d6bfece8529f64e78239deebd162470 | 33 / 9 |

Both runs succeeded with no unfinished work. Camera DOM geometry matched the
80×120 origin and 1120×480 opening. All 537,600 opening pixels were transparent
in OBS; actual compositing revealed the checker beneath. Creator font bytes and
rendered glyph metrics were verified. Schedule rows and labels matched the exact
inputs; all 921,600 pixels were opaque. Static hold and refresh images matched.
Both update APIs passed safe-text, atomic-rejection and restoration checks.
OBS scene inventory was restored and broadcast outputs remained stopped.

Sealos access recovered after the user supplied a fresh trusted kubeconfig.
Public authenticated HTML/API and MCP checks pass; anonymous HTML remains
protected. Device-code login was separate from the earlier access failure.
