# VideoPhysEdit project page

Static project page for **VideoPhysEdit: Physical Counterfactual Video Editing via Rigid-Body Physical Scene Reconstruction**.

[Project website](https://videophysedit.github.io/)

## Preview

Run `python scripts/preview.py` from this directory and open `http://127.0.0.1:8765`. This server supports video seeking. Use `--port 8766` to choose another port. No build step is needed.

## Update

- Edit the page text and quantitative table in `index.html`.
- Set authors, affiliations, paper links, and citation in `assets/js/content.js`.
- Configure the homepage interactive demo in `assets/data/interactive-demo.json`.
- Configure synthetic baseline comparisons in `assets/data/synthetic-comparison.json`.
- Configure real-video baseline comparisons in `assets/data/real-comparison.json`.
- Configure the seven object-removal comparisons, including VOID, in `assets/data/removal-comparison.json`.
- Adjust the layout in `assets/css/style.css`.
- `assets/images/method-overview.pdf` is the original Figure 2 from the paper, rendered directly on the page. The WebP preview remains available if PDF rendering is unavailable.
- Add videos later under `assets/videos/` and use relative paths, for example `assets/videos/example.mp4`. Empty paths display placeholders without requesting a video.

The Three dominoes demo includes its source video, 18 removal results, and 18 mass ×10 results. Ramp collision supports removal and Mass ×20 for all three balls at 0.00 and 0.92 seconds (frames 1 and 23, just as the red and blue balls collide). Yellow-ball mass edits replay the source because it remains stationary and does not collide with either ball. Football & block includes removal of either object, velocity, object restitution, and scene gravity edits at three times. Authors and affiliation follow the desktop arXiv manuscript. Paper links and citation details are unset. Quantitative results and the abstract follow the current manuscript.

## Interactive demo

Each scene shows its available edit types. Three dominoes includes removal of each of the three objects at six fixed frames: 1, 19, 25, 31, 37, and 55 (0.00, 0.75, 1.00, 1.25, 1.50, and 2.25 seconds). Choose an edit, select a time, click a domino, then play the comparison. Changing the time keeps the selected domino for comparison. Reset returns to time selection. Mass ×10 is available for each of the three dominoes at the same six edit frames.

Football & block offers edits at 0.00, 0.25, and 0.75 seconds: remove the football or wooden block, double the football’s velocity, double either object’s coefficient of restitution, or halve scene gravity. Velocity ×2, Restitution ×2, and Gravity ×0.5 are fixed edit buttons, like Mass ×10 in the domino scene. For removal, velocity, and restitution, select a time, click the football or wooden block in the source video, then play. Selecting the wooden block for velocity replays the source. Each selection applies one edit and looks up its exact prepared video. The football source retains its original 1280×720 resolution; its 67-frame results use 768×432 at 24 fps.

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

Scenes with `editTimeline` append a one-based frame to the variant key, for example `remove:domino-1:frame-25` or `mass:domino-2:10:frame-1`. Frame 25 corresponds to 1.00 s at 24 fps. Set `source.fps`, `source.frameCount`, and each object's normalized polygon `track` to keep its click region aligned as it moves. `editTimeline.frames` sets the allowed edit frames and the preparation-list export. Playback seeking stays continuous; returning to editing restores the selected edit time. A missing object/action/frame combination shows no result; it never substitutes a clip from another time.

The domino removal videos contain 81 frames at 24 fps, including the source video before the selected edit time. They use square pixels at 768×432 to match the source's 16:9 display ratio.

Export the current video preparation list with `node scripts/list-demo-variants.mjs planned-videos.csv`. Check the selection mapping with `node --test tests/demo-model.test.mjs`.

## Baseline comparisons

The synthetic comparison section includes five selectable scenes with Source, VACE, Ditto, MiniMax H3, Seedance 2.5, and VideoPhysEdit. Videos automatically play together when visible and restart together after the longest clip ends. Shorter clips hold their last frame. Switching scenes starts a new comparison; scrolling away pauses playback. The shared timeline uses seconds at the original playback speed, and manual pause and seeking remain available. Each video can also be opened separately.

Real-video comparisons cover projectile speed ×2, rolling-can speed ×0.5, large-ball mass ×0.5, and ramp gravity ×0.5. They use the same playback controls as synthetic comparisons, with 5:4 or 3:2 scene frames and the original media aspect ratios preserved within each frame.

## Publish with GitHub Pages

Use the `videophysedit/videophysedit.github.io` repository. In **Settings → Pages**, choose **Deploy from a branch**, then **main / (root)**. Keep `.nojekyll` at the repository root.

## Links

- [Method repository](https://github.com/Hammour-steak/VideoPhysEdit)
- [PCVE-RigidBench](https://github.com/Hammour-steak/PCVE-RigidBench)

The layout is inspired by the [3DPhysVideo project page](https://hwidong-kim.github.io/projects/3DPhysVideo/). This site uses an original HTML/CSS/JavaScript implementation and does not include that project's images, videos, or research text.

PDF rendering uses Mozilla PDF.js 5.6.205, bundled under `assets/vendor/pdfjs/` with its Apache 2.0 license.
