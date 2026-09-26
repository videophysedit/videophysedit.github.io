import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describeSelection, initialSelection, insertionObject, listVariants } from "../assets/js/demo-model.mjs";

const config = JSON.parse(await readFile(new URL("../assets/data/interactive-demo.json", import.meta.url)));
const [collision] = config.scenes;

test("four scenes have unique exact variant keys and useful initial states", () => {
  assert.equal(config.scenes.length, 4);
  for (const scene of config.scenes) {
    const variants = listVariants(scene, config.controls);
    assert.equal(new Set(variants.map(item => item.key)).size, variants.length);
    assert.ok(variants.every(item => item.instruction && !item.clip));
    const selected = describeSelection(scene, config.controls, initialSelection(scene, config.controls));
    assert.equal(Boolean(selected), scene.defaultMode !== "remove");
  }
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
