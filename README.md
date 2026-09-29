# VideoPhysEdit project page

Static website for **VideoPhysEdit: Physical Counterfactual Video Editing via Rigid-Body Physical Scene Reconstruction**.

[Website](https://videophysedit.github.io/) · [Paper](https://arxiv.org/abs/2609.35134) · [Code](https://github.com/Hammour-steak/VideoPhysEdit) · [Benchmark](https://github.com/Hammour-steak/PCVE-RigidBench)

## Preview and checks

No build step is needed. Run `python scripts/preview.py` and open `http://127.0.0.1:8765`. Use `--port 8766` to choose another port. The server supports video seeking.

Run `node --test tests/*.test.mjs` to check demo selection and comparison playback. Export the demo video preparation list with `node scripts/list-demo-variants.mjs planned-videos.csv`.

## Edit the page

- Page text, figures, and quantitative results: `index.html`.
- Authors, affiliations, paper links, and BibTeX: `assets/js/content.js`.
- Layout: `assets/css/style.css`; demo and comparison styles have separate CSS files.
- Interactive scenes and prepared results: `assets/data/interactive-demo.json`.
- Baseline results: `assets/data/synthetic-comparison.json`, `real-comparison.json`, and `removal-comparison.json`.

Media paths are relative to the website root. Each demo selection resolves to an exact key in the scene's `variants` map. Timed edits append a one-based frame, such as `remove:domino-1:frame-25`. At 24 fps, frame 25 is 1.00 s. Normalized object tracks define the clickable regions. Missing combinations do not substitute results from another edit or time.

Comparison videos start together when visible and restart after all clips finish. Shorter clips hold their last frame; playback is not repeatedly corrected by seeking. Scrolling away pauses playback. Real-video comparisons use centered 16:9 display crops; Open video shows the original file.

The method figure renders from `assets/images/method-overview.pdf`, with a WebP fallback. The task illustration uses `assets/images/task-examples.webp`; its source PDF is retained alongside it.

## Publish

In the `videophysedit/videophysedit.github.io` repository, set **Settings → Pages → Deploy from a branch → main / (root)**. Keep `.nojekyll` at the root.

The layout is inspired by [3DPhysVideo](https://hwidong-kim.github.io/projects/3DPhysVideo/). This site has its own HTML/CSS/JavaScript implementation. Mozilla PDF.js 5.6.205 is bundled under `assets/vendor/pdfjs/` with its Apache 2.0 license. Institution logo sources are documented in `assets/images/identity/SOURCES.md`.
