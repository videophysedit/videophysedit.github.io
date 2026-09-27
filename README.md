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

The Three dominoes demo includes its source video, 18 removal results, and one mass ×10 result. The other three scenes use labeled illustrations. Paper links, authors, affiliations, and citation details are unset. Quantitative results and the abstract follow the current manuscript.

## Interactive demo

Each scene shows its available edit types. Three dominoes includes removal of each of the three objects at six fixed frames: 1, 19, 25, 31, 37, and 55 (0.00, 0.75, 1.00, 1.25, 1.50, and 2.25 seconds). Click a domino to highlight it from the click point, choose an action, and drag the edit-time slider or click a time label. Mass ×10 is available for the second domino at frame 1. The Examples menu provides shortcuts to selected results.

Each selection applies one edit and looks up one prepared video. Other scene controls cover initial velocity, friction, restitution, and insertion at 1/6, 1/3, 1/2, 2/3, and 5/6 of a path. Elasticity and restitution share one control.

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

Video paths are relative to the website root. The source has its own play/pause button and can play independently even when a result is selected. The shared playback controls synchronize both clips and hold the shorter clip's last frame. The playback timeline follows the active player. The edit-time slider selects the intervention frame. Only selected clips are loaded, and slider video requests wait until the thumb is released.

Scenes with `editTimeline` append a one-based frame to the variant key, for example `remove:domino-1:frame-25` or `mass:domino-2:10:frame-1`. Frame 25 corresponds to 1.00 s at 24 fps. Set `source.fps`, `source.frameCount`, and each object's normalized polygon `track` to keep its click region aligned as it moves. `editTimeline.frames` sets the allowed edit frames and the preparation-list export. Playback seeking stays continuous; entering edit mode from playback snaps to the nearest allowed frame. A missing object/action/frame combination shows no result; it never substitutes a clip from another time. The `presets` list points to available results.

The removal videos contain 81 frames at 24 fps, including the source video before the selected edit time. They use square pixels at 768×432 to match the source's 16:9 display ratio.

Export the current video preparation list with `node scripts/list-demo-variants.mjs planned-videos.csv`. Check the selection mapping with `node --test tests/demo-model.test.mjs`.

## Publish with GitHub Pages

Use the `videophysedit/videophysedit.github.io` repository. In **Settings → Pages**, choose **Deploy from a branch**, then **main / (root)**. Keep `.nojekyll` at the repository root.

## Links

- [Method repository](https://github.com/Hammour-steak/VideoPhysEdit)
- [PCVE-RigidBench](https://github.com/Hammour-steak/PCVE-RigidBench)

The layout is inspired by the [3DPhysVideo project page](https://hwidong-kim.github.io/projects/3DPhysVideo/). This site uses an original HTML/CSS/JavaScript implementation and does not include that project's images, videos, or research text.

PDF rendering uses Mozilla PDF.js 5.6.205, bundled under `assets/vendor/pdfjs/` with its Apache 2.0 license.
