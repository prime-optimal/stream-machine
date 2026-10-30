# Stream Machine scenarios

Two Open Design scenarios turn a creator brief into editable, standalone OBS HTML.

| Scenario | Use it for | Output behavior |
| --- | --- | --- |
| [Stream Alert Authoring](stream-alert-authoring/README.md) | Follower celebrations and other finite visual alerts | Transparent while idle; plays when its event API is called |
| [Stream Overlay Authoring](stream-overlay-authoring/README.md) | Camera frames and full-screen schedules | Persistent static composition |

## Creator workflow

1. Install the chosen package folder through Open Design's **My plugins**, or use
   its README's CLI instructions. Select that installed scenario for generation.
2. Supply a brand guide when available, creator assets/fonts, output dimensions,
   exact labels and desired colors. Mark unknown event details TBA or synthetic.
   Explicit event-specific changes should override the guide visibly in provenance.
3. Generate one representative asset. Review typography at its intended display
   size, content accuracy and overall direction before producing variations.
4. Approve it, request focused revisions, or supply a different visual reference.
   Keep prior approved versions; each output includes editable source/config for
   later changes. Expand to additional event assets only after this review.
5. Download the final HTML and its README. Match OBS Browser Source dimensions to
   the output manifest. Keep the editable bundle for future revisions.

For a camera frame, place the browser source above the camera source. Its clear
opening reveals the camera beneath. A full-screen schedule intentionally covers
the canvas. An alert opened normally is empty until its API receives an event;
`?preview=1` is a labeled synthetic demo, not a Twitch connection.

## Service boundary

These packages author visual assets. Real Twitch delivery still needs a separate
authenticated backend/event adapter. Keep OAuth credentials and provider secrets
out of generated HTML. The alert package documents its event contract separately.

Both packages were authored/refined through hosted Open Design + Codex, then
installed and invoked afresh. K-Lab Halloween and fictional Night Arcade fixtures
exercise different typography, colors and use cases. Private creator fonts are
output-specific; public defaults use system fonts.

[Acceptance record](../../docs/stream-scenarios-acceptance.md) describes actual
cloud, browser and OBS evidence plus the limits of those checks.
