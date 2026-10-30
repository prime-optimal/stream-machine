# OBS overlay

Add Browser Source → Local file → index.html. Set width 1920, height 1080. Keep OBS default transparent browser-source CSS. Place camera-frame ABOVE your camera source; align camera to aperture in manifest.json. Schedule fills the canvas. No authentication, internet, audio, flags or external assets required. Both motion choices are static; reduced motion is inherently respected. No GSAP or timeline is used because no animation is authored.

Edit source.json, then run Node 24: node editable/tools/build.cts source.json ../overlay-v2. Destination must be new. Retain this version until the replacement is approved. Geometry is calculated from CSS layout in source pixels, not pixel-measured evidence; OBS scaling scales the whole composition.

Browser API: StreamOverlay.update({title,copy,accent,background,foreground,schedule}) accepts any subset, validates atomically, and returns geometry. Text is escaped; colors are #RRGGBB with contrast checks. StreamOverlay.geometry() reports calculated variant-specific bounds: camera clear aperture and external border/nameplate with partial canvas coverage, or schedule full opaque canvas coverage and schedule/row bounds with no camera fields. Blank/auto/null or omitted aperture derives from dimensions for camera; explicit object or JSON uses source pixels. Schedule ignores aperture entirely. Live updates are ephemeral; edit source.json and rebuild to persist.

source.json embeds any supplied font; retain its license and do not redistribute without permission. manifest.json records provenance and output hash.
