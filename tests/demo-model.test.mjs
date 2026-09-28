import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { describeSelection, initialSelection, insertionObject, listVariants, interventionTime, objectAtFrame, sceneModes, editableFrames, nearestEditFrame } from "../assets/js/demo-model.mjs";

const config = JSON.parse(await readFile(new URL("../assets/data/interactive-demo.json", import.meta.url)));
const football = config.scenes.find(scene => scene.id === "football");
const domino = config.scenes.find(scene => scene.id === "domino");

test("three scenes have unique exact variant keys and useful initial states", () => {
  assert.equal(config.scenes.length, 3);
  for (const scene of config.scenes) {
    const variants = listVariants(scene, config.controls);
    assert.equal(new Set(variants.map(item => item.key)).size, variants.length);
    assert.ok(variants.every(item => item.instruction));
    const selected = describeSelection(scene, config.controls, initialSelection(scene, config.controls));
    assert.equal(Boolean(selected), scene.defaultMode !== "remove");
  }
});

test("domino edits wait for a time selection before choosing a result", () => {
  const selection = initialSelection(domino, config.controls);
  assert.equal(selection.timeChosen, false);
  assert.equal(describeSelection(domino, config.controls, { ...selection, objectId: "domino-1" }), null);
  const chosen = { ...selection, timeChosen: true, objectId: "domino-1", editFrame: 19 };
  assert.equal(describeSelection(domino, config.controls, chosen).clip.caseId, "remove_first_f19");
  assert.equal(describeSelection(domino, config.controls, { ...chosen, editFrame: 25 }).clip.caseId, "remove_first_f25");
  assert.equal(initialSelection(domino, config.controls).timeChosen, false);
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
  assert.equal(Object.keys(domino.variants).length, 36);
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
  for (const editFrame of editableFrames(domino)) {
    for (let index = 0; index < domino.objects.length; index++) {
      const variant = describeSelection(domino, config.controls, {
        ...heavy, objectId: domino.objects[index].id, editFrame,
      });
      const existing = index === 1 && editFrame === 1;
      assert.equal(variant.clip.caseId, existing ? "second_mass_x10" : `mass_${names[index]}_f${editFrame}`);
      if (!existing) assert.ok(variant.clip.video.endsWith(`${names[index]}-mass-10x-frame-${editFrame}.mp4`));
      await access(new URL(`../${variant.clip.video}`, import.meta.url));
      await access(new URL(`../${variant.clip.poster}`, import.meta.url));
    }
  }
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
  assert.equal(variants.filter(item => item.clip).length, 36);
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

test("football controls use exact clips and scene-wide gravity", async () => {
  assert.deepEqual(sceneModes(football).map(m => m.id), ["remove", "velocity", "restitution", "gravity"]);
  assert.deepEqual(editableFrames(football), [1,7,19]);
  const variants = listVariants(football, config.controls);
  assert.equal(variants.length, 36);
  for (const variant of variants) {
    assert.ok(variant.clip);
    await access(new URL(`../${variant.clip.video}`, import.meta.url));
  }
  for (const [objectId, name] of [["football", "ball"], ["block", "block"]]) {
    for (const editFrame of [1, 7, 19]) {
      const removal = describeSelection(football, config.controls, {mode: "remove", objectId, editFrame});
      assert.ok(removal.clip.video.endsWith(`remove-${name}-frame-${editFrame}.mp4`));
      const object = objectAtFrame(removal.object, editFrame);
      assert.ok(object.w > 0 && object.h > 0 && object.polygon.length >= 4);
    }
  }
  const velocity = describeSelection(football, config.controls, {mode:"velocity",objectId:"football",stepIndex:1,editFrame:1});
  assert.match(velocity.clip.video, /speed_x2/);
  assert.match(describeSelection(football,config.controls,{mode:"velocity",objectId:"football",stepIndex:1,editFrame:7}).clip.video,/velocity-frame-7/);
  assert.equal(describeSelection(football,config.controls,{mode:"velocity",objectId:"football",stepIndex:1,editFrame:13}),null);
  const bounce = describeSelection(football, config.controls, {mode:"restitution",objectId:"football",stepIndex:1,editFrame:1});
  assert.match(bounce.instruction, /football/);
  assert.match(bounce.instruction, /2× its original value/);
  assert.match(describeSelection(football, config.controls, {mode:"restitution",objectId:"football",stepIndex:0,editFrame:1}).clip.video, /source-720p/);
  assert.match(bounce.clip.video, /restitution-x2-frame-1/);
  const gravity = describeSelection(football, config.controls, {mode:"gravity",objectId:"scene",stepIndex:0,editFrame:1});
  assert.match(gravity.clip.video, /gravity_x05/);
  assert.equal(gravity.object.scope, "scene");
  assert.equal(describeSelection(football,config.controls,{mode:"gravity",objectId:"football",stepIndex:0}),null);
  for (const editFrame of [1,7,19]) {
    for (const stepIndex of [0,1]) {
      const blockVelocity = describeSelection(football,config.controls,{mode:"velocity",objectId:"block",stepIndex,editFrame});
      assert.match(blockVelocity.instruction, /wooden block/);
      assert.equal(blockVelocity.clip.video, football.source.video);
    }
    const blockBounce = describeSelection(football,config.controls,{mode:"restitution",objectId:"block",stepIndex:1,editFrame});
    assert.match(blockBounce.instruction, /wooden block/);
    assert.ok(blockBounce.clip.video.endsWith(`block-restitution-x2-frame-${editFrame}.mp4`));
    assert.match(describeSelection(football,config.controls,{mode:"restitution",objectId:"block",stepIndex:0,editFrame}).clip.video,/source-720p/);
  }
  assert.equal(describeSelection(football,config.controls,{mode:"velocity",objectId:"football",stepIndex:2}),null);
  assert.match(describeSelection(football,config.controls,{mode:"velocity",objectId:"football",stepIndex:0}).clip.video,/source/);
});


test("ramp uses mass twenty and contact-frame tracks without changing domino mass", async () => {
  const ramp = config.scenes.find(scene => scene.id === "ramp");
  assert.deepEqual(editableFrames(ramp), [1,23]);
  const variants = listVariants(ramp, config.controls);
  assert.equal(variants.length,12);
  for (const variant of variants) {
    assert.ok(variant.clip);
    await access(new URL(`../${variant.clip.video}`, import.meta.url));
    if (variant.mode === "mass") assert.equal(variant.step.value,20);
    if (variant.mode === "mass" && variant.object.id === "yellow") assert.equal(variant.clip.video,ramp.source.video);
    assert.equal(objectAtFrame(variant.object,variant.editFrame).polygon.length,40);
  }
  assert.ok(listVariants(domino,config.controls).filter(v=>v.mode==="mass").every(v=>v.step.value===10));
});
