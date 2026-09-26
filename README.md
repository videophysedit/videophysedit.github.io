# VideoPhysEdit project page

Static project page for **VideoPhysEdit: Physical Counterfactual Video Editing via Rigid-Body Physical Scene Reconstruction**.

[Project website](https://videophysedit.github.io/)

## Preview

Run `python scripts/preview.py` from this directory and open `http://127.0.0.1:8765`. This server supports video seeking. Use `--port 8766` to choose another port. No build step is needed.

## Update

- Edit the page text and quantitative table in `index.html`.
- Set authors, affiliations, paper links, citation, and video paths in `assets/js/content.js`.
- Configure the homepage interactive demo in `assets/data/interactive-demo.json`.
- Adjust the layout in `assets/css/style.css`.
- `assets/images/method-overview.pdf` is the original Figure 2 from the paper, rendered directly on the page. The WebP preview remains available if PDF rendering is unavailable.
- Add videos later under `assets/videos/` and use relative paths, for example `assets/videos/example.mp4`. Empty paths display placeholders without requesting a video.

The interactive demo currently uses illustrations, labeled as previews. Paper links, authors, affiliations, and citation details are unset. Quantitative results and the abstract follow the current manuscript.

## Interactive demo

The four scene tabs share five edit types: object removal, initial velocity, friction, restitution, and object insertion. Each selection applies one edit and looks up one prepared video. Sliders use discrete stops; insertion positions are 1/6, 1/3, 1/2, 2/3, and 5/6. Elasticity and restitution share one control.

In `assets/data/interactive-demo.json`, set each scene's `source.video`, `source.poster`, and `source.editTime`. Object centers and sizes (`x`, `y`, `w`, `h`) are fractions of the source frame. Match `source.width` and `source.height` to the actual video aspect ratio. The `edits` list controls which objects can be edited in each mode.

Add result videos under the exact keys in each scene's `variants` object:

```json
"variants": {
  "remove:amber-ball": {
    "video": "assets/videos/interactive/collision/remove-amber-ball.mp4",
    "poster": "assets/images/collision-remove-amber-ball.jpg"
  },
  "velocity:blue-ball:1.5": {
    "video": "assets/videos/interactive/collision/velocity-blue-ball-1.5.mp4"
  },
  "insert:new-block:1-2": {
    "video": "assets/videos/interactive/collision/insert-new-block-1-2.mp4"
  }
}
```

Video paths are relative to the website root. An unfilled entry displays a preview with playback disabled. The shared play and seek controls synchronize source and result videos; object selection returns to `editTime` so hotspots stay aligned. Only the selected clips are loaded, and slider video requests wait until the thumb is released.

Export the current video preparation list with `node scripts/list-demo-variants.mjs planned-videos.csv`. Check the selection mapping with `node --test tests/demo-model.test.mjs`.

## Publish with GitHub Pages

Use the `videophysedit/videophysedit.github.io` repository. In **Settings → Pages**, choose **Deploy from a branch**, then **main / (root)**. Keep `.nojekyll` at the repository root.

## Links

- [Method repository](https://github.com/Hammour-steak/VideoPhysEdit)
- [PCVE-RigidBench](https://github.com/Hammour-steak/PCVE-RigidBench)

The layout is inspired by the [3DPhysVideo project page](https://hwidong-kim.github.io/projects/3DPhysVideo/). This site uses an original HTML/CSS/JavaScript implementation and does not include that project's images, videos, or research text.

PDF rendering uses Mozilla PDF.js 5.6.205, bundled under `assets/vendor/pdfjs/` with its Apache 2.0 license.
