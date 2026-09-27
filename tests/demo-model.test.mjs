import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { describeSelection, initialSelection, insertionObject, listVariants, interventionTime, objectAtFrame, sceneModes, editableFrames, nearestEditFrame } from "../assets/js/demo-model.mjs";

const config = JSON.parse(await readFile(new URL("../assets/data/interactive-demo.json", import.meta.url)));
const collision = config.scenes.find(scene => scene.id === "collision");
const domino = config.scenes.find(scene => scene.id === "domino");

test("four scenes have unique exact variant keys and useful initial states", () => {
  assert.equal(config.scenes.length, 4);
  for (const scene of config.scenes) {
    const variants = listVariants(scene, config.controls);
    assert.equal(new Set(variants.map(item => item.key)).size, variants.length);
    assert.ok(variants.every(item => item.instruction));
    const selected = describeSelection(scene, config.controls, initialSelection(scene, config.controls));
    assert.equal(Boolean(selected), scene.defaultMode !== "remove");
  }
});

test("domino clips match the exact object, operation and one-based intervention frame", async () => {
  assert.deepEqual(sceneModes(domino).map(mode => mode.id), ["remove", "mass"]);
  const selection = { mode: "remove", objectId: "domino-1", stepIndex: 0, editFrame: 25 };
  assert.equal(interventionTime(domino, 25), 1);
  assert.equal(interventionTime(domino, 1), 0);
  assert.match(describeSelection(domino, config.controls, selection).clip.video, /remove-first-frame-25/);
  assert.equal(describeSelection(domino, config.controls, { ...selection, editFrame: 24 }), null);
  assert.equal(describeSelection(domino, config.controls, { ...selection, objectId: "domino-3" }).clip.caseId, "remove_third_f25");
  assert.equal(describeSelection(domino, config.controls, { ...selection, editFrame: 0 }), null);
  assert.equal(describeSelection(domino, config.controls, { ...selection, editFrame: 82 }), null);
  assert.equal(describeSelection(domino, config.controls, { ...selection, editFrame: 2.5 }), null);
  assert.equal(Object.keys(domino.variants).length, 19);
  const names = ["first", "second", "third"];
  for (const editFrame of editableFrames(domino)) {
    for (let index = 0; index < domino.objects.length; index++) {
      const objectId = domino.objects[index].id;
      const variant = describeSelection(domino, config.controls, { ...selection, objectId, editFrame });
      assert.equal(variant.clip.caseId, `remove_${names[index]}_f${editFrame}`);
      assert.ok(variant.clip.video.endsWith(`remove-${names[index]}-frame-${editFrame}.mp4`));
      await access(new URL(`../${variant.clip.video}`, import.meta.url));
      await access(new URL(`../${variant.clip.poster}`, import.meta.url));
    }
  }
  for (const preset of domino.presets) {
    const variant = describeSelection(domino, config.controls, preset);
    assert.ok(variant.clip);
    await access(new URL(`../${variant.clip.video}`, import.meta.url));
    await access(new URL(`../${variant.clip.poster}`, import.meta.url));
  }
  const heavy = { mode: "mass", objectId: "domino-2", stepIndex: 0, editFrame: 1 };
  assert.match(describeSelection(domino, config.controls, heavy).clip.video, /second-mass-10x/);
  assert.equal(describeSelection(domino, config.controls, { ...heavy, editFrame: 25 }).clip, null);
});

test("domino edits use six fixed times while playback can return to the nearest allowed frame", () => {
  const frames = [1, 19, 25, 31, 37, 55];
  assert.deepEqual(editableFrames(domino), frames);
  assert.deepEqual(frames.map(frame => interventionTime(domino, frame)), [0, .75, 1, 1.25, 1.5, 2.25]);
  for (const frame of frames) assert.equal(nearestEditFrame(domino, frame), frame);
  assert.equal(nearestEditFrame(domino, 13), 19);
  assert.equal(nearestEditFrame(domino, 23), 25);
  assert.equal(nearestEditFrame(domino, 22), 19);
  assert.equal(nearestEditFrame(domino, 81), 55);
  const selection = { mode: "remove", objectId: "domino-1", stepIndex: 0 };
  for (const editFrame of [13, 24, 26, 49, 81]) {
    assert.equal(describeSelection(domino, config.controls, { ...selection, editFrame }), null);
  }
  const variants = listVariants(domino, config.controls);
  assert.equal(variants.length, 36);
  assert.equal(variants.filter(item => item.clip).length, 19);
  assert.deepEqual([...new Set(variants.map(item => item.editFrame))], frames);
  assert.equal(describeSelection(domino, config.controls, { ...selection, editFrame: 55 }).clip.caseId, "remove_first_f55");
});

test("click regions follow the selected source frame and interpolate between keyframes", () => {
  const object = domino.objects[0];
  const first = objectAtFrame(object, 1), next = objectAtFrame(object, 13), middle = objectAtFrame(object, 7);
  assert.deepEqual(first.polygon, object.track[0].polygon);
  assert.ok(Math.abs(middle.polygon[0][0] - (first.polygon[0][0] + next.polygon[0][0]) / 2) < 1e-9);
  const last = objectAtFrame(object, 81);
  assert.ok(last.w > first.w && last.h < first.h);
});

test("chooses only the exact prepared clip, without a nearest-value fallback", () => {
  const scene = { ...collision, variants: { "velocity:blue-ball:1.5": { video: "matched.mp4" }, "remove:blue-ball": { video: "remove.mp4" } } };
  const selection = { mode: "velocity", objectId: "blue-ball", stepIndex: 2 };
  assert.equal(describeSelection(scene, config.controls, selection).clip.video, "matched.mp4");
  assert.equal(describeSelection(scene, config.controls, { ...selection, stepIndex: 3 }).clip, null);
  assert.equal(describeSelection(scene, config.controls, { ...selection, mode: "remove" }).clip.video, "remove.mp4");
});

test("rejects unavailable targets, non-integer steps, and unknown modes", () => {
  assert.equal(describeSelection(collision, config.controls, { mode: "friction", objectId: "amber-ball", stepIndex: 2 }), null);
  assert.equal(describeSelection(collision, config.controls, { mode: "velocity", objectId: "blue-ball", stepIndex: 2.1 }), null);
  assert.equal(describeSelection(collision, config.controls, { mode: "velocity", objectId: "blue-ball", stepIndex: 9 }), null);
  assert.equal(describeSelection(collision, config.controls, { mode: "unknown", objectId: "blue-ball", stepIndex: 0 }), null);
});

test("insertion slots retain fractional positions and put the object's base on the path", () => {
  const variants = listVariants(collision, config.controls).filter(item => item.mode === "insert");
  assert.deepEqual(variants.map(item => item.step.label), ["1/6", "1/3", "1/2", "2/3", "5/6"]);
  const center = insertionObject(collision, 0.5);
  assert.equal(center.x, (collision.insertion.start.x + collision.insertion.end.x) / 2);
  assert.ok(Math.abs(center.y + center.h / 2 - collision.insertion.start.y) < 1e-10);
});
