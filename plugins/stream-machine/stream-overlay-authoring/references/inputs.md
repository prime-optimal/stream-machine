# Wired input contract

Node 24: `node tools/build.cts config.json new-output-folder`. Resolve tool paths from the installed/staged skill folder; outputs resolve against the invocation cwd. Existing output directories are never overwritten.

| Field | Accepted value / default |
|---|---|
| variant | camera-frame (default), fullscreen-schedule |
| title | 1–42 characters; WEEKEND / STUDIO |
| style | technical (system sans) or editorial (Georgia); technical default |
| accent | #b9ef67, strict six-digit hex |
| background | #111b20, strict six-digit hex |
| foreground | #f4f7ef, strict six-digit hex |
| width / height | Integer 640–3840 / 360–2160; default 1920 / 1080; landscape ratio 1.5–2 |
| aperture | Camera only: omitted, null, blank/whitespace or auto derives from current dimensions; manifest default is auto. Explicit object or JSON {x,y,width,height} uses integer source pixels. Ignored for schedule. |
| schedule | Array or JSON text of 1–6 {time,name} strings, max 12 / 38 chars; default three synthetic sample slots |
| synthetic | Boolean true by default; false only for verified supplied lineup |
| copy | 1–80 chars; supporting copy at foot of each variant |
| motion | static or reduced; both render static, with no animation runtime |
| font | null, or {data,source,license}; data:font/woff2;base64,… ≤2,800,000 URI characters; source/license each 1–180 chars |

Font data overrides primary typography in both styles and variants, including schedule times. Package includes no creator font. Validate creator fonts with a trusted font tool before embedding; the builder validates the data-URI envelope, not font glyph correctness or licensing rights. Default examples are original generic geometry with chosen colors, not measured brand assets.

Brand guide and font upload manifest inputs are intake material: the agent reads the guide into these wired config fields and records sources in brand-decisions.md; a font file becomes an output-scoped data URI. No external font path is accepted by the builder.

Camera-only bounds: aperture left ≥3.125%, top ≥15%, right ≤96.875%, bottom ≤86%; width/height ≥25% of canvas. Border is an outward-only shadow with no filled interior or element intercepting camera pixels. Title and nameplate sit outside the aperture; report lists nameplate and border rectangles. Arbitrary vertical/mobile canvases are intentionally unsupported. Mobile recap means scaled landscape output, not portrait reflow.

Styles are seed directions, not fixed aesthetic constraints. For extremely wide glyphs or multilingual copy, visually check fit and revise project-owned layout/text before approval. A font structural test fixture is not proof of font rendering.

## Conditional fields and calculated geometry

The normalizer accepts the complete set of manifest defaults directly, including JSON schedule text. Optional guide/font uploads remain agent intake material, not builder fields. At 1280×720, auto camera aperture becomes {x:80,y:120,width:1120,height:480}; at 1920×1080 it remains {x:120,y:180,width:1680,height:720}. Normalized camera source.json stores resolved pixel coordinates; set aperture back to auto when changing dimensions if proportional resizing is wanted. Only camera parses, validates and renders aperture. Fullscreen schedule discards any aperture value without parsing or using it and records aperture:null in normalized source. Invalid or stale camera coordinates cannot block schedule generation. Top-level unknown fields, unsafe text/colors and applicable object-field validation still reject invalid inputs. Schedule content remains validated in both variants, but only fullscreen-schedule renders it.

geometry() and manifest.json report evidence:calculated-layout, not pixel-measured evidence. Camera returns canvas.opaque:false, canvas.coverage:partial, aperture, borderInner/borderOuter, nameplate and apertureCovered:false. Schedule returns canvas.opaque:true, canvas.coverage:full, scheduleBounds and one rectangle per row; aperture, borders, nameplate and apertureCovered are absent. Schedule bounds describe the grid at x=5%, y=30%, width=90%, height=51%; rows divide that height equally. Canvas coverage refers to the authored canvas, not letterbox areas outside it. Browser/OBS and creator-font fit checks remain separate.
