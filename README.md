# VideoPhysEdit project page

Static project page for **VideoPhysEdit: Physical Counterfactual Video Editing via Rigid-Body Physical Scene Reconstruction**.

[Project website](https://videophysedit.github.io/)

## Preview

Run `python -m http.server 8765` from this directory and open `http://localhost:8765`.
No build step is needed.

## Update

- Edit the page text and quantitative table in `index.html`.
- Set authors, affiliations, paper links, citation, and video paths in `assets/js/content.js`.
- Adjust the layout in `assets/css/style.css`.
- `assets/images/method-overview.pdf` is the original Figure 2 from the paper, rendered directly on the page. The WebP preview remains available if PDF rendering is unavailable.
- Add videos later under `assets/videos/` and use relative paths, for example `assets/videos/example.mp4`. Empty paths display placeholders without requesting a video.

The initial version includes no videos. Paper links, authors, affiliations, and citation details are intentionally unset. Quantitative results and the abstract follow the current manuscript.

## Publish with GitHub Pages

Use the `videophysedit/videophysedit.github.io` repository. In **Settings → Pages**, choose **Deploy from a branch**, then **main / (root)**. Keep `.nojekyll` at the repository root.

## Links

- [Method repository](https://github.com/Hammour-steak/VideoPhysEdit)
- [PCVE-RigidBench](https://github.com/Hammour-steak/PCVE-RigidBench)

The layout is inspired by the [3DPhysVideo project page](https://hwidong-kim.github.io/projects/3DPhysVideo/). This site uses an original HTML/CSS/JavaScript implementation and does not include that project's images, videos, or research text.

PDF rendering uses Mozilla PDF.js 5.6.205, bundled under `assets/vendor/pdfjs/` with its Apache 2.0 license.
