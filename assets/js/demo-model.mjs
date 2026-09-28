export const modes = [
  { id: "remove", label: "Remove", icon: "minus" },
  { id: "mass", label: "Increase mass", icon: "mass" },
  { id: "insert", label: "Insert", icon: "plus" },
  { id: "velocity", label: "Velocity", icon: "arrow" },
  { id: "friction", label: "Friction", icon: "surface" },
  { id: "restitution", label: "Restitution", icon: "bounce" },
  { id: "gravity", label: "Gravity", icon: "gravity" },
];

export function sceneControls(scene, controls) {
  return { ...controls, ...scene.controls };
}

export function editableObjects(scene, mode) {
  if (scene.globalEdits?.includes(mode)) return [{ id: "scene", label: "Scene", scope: "scene", edits: [mode] }];
  return scene.objects.filter(object => object.edits.includes(mode));
}

export function sceneModes(scene) {
  return modes.filter(mode => mode.id === "insert" ? scene.insertion : editableObjects(scene, mode.id).length);
}

export function interventionTime(scene, frame) {
  return scene.editTimeline ? (frame - 1) / scene.source.fps : scene.source.editTime;
}

export function editableFrames(scene, mode) {
  if (mode === "insert" && scene.insertion?.frames) return scene.insertion.frames;
  return scene.editTimeline?.frames || [scene.editTimeline?.defaultFrame ?? 1];
}

export function nearestEditFrame(scene, frame) {
  return editableFrames(scene).reduce((nearest, candidate) =>
    Math.abs(candidate - frame) < Math.abs(nearest - frame) ? candidate : nearest
  );
}

export function objectAtFrame(object, frame) {
  if (!object.track?.length) return object;
  const after = object.track.findIndex(item => item.frame >= frame);
  const right = object.track[after < 0 ? object.track.length - 1 : after];
  const left = object.track[Math.max(0, after < 0 ? object.track.length - 1 : after - 1)];
  const mix = right.frame === left.frame ? 0 : Math.max(0, Math.min(1, (frame - left.frame) / (right.frame - left.frame)));
  const polygon = left.polygon.map((point, i) => point.map((value, j) => value + (right.polygon[i][j] - value) * mix));
  const xs = polygon.map(point => point[0]), ys = polygon.map(point => point[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  return { ...object, polygon, x: Math.min(...xs) + w / 2, y: Math.min(...ys) + h / 2, w, h };
}

export function initialSelection(scene, controls) {
  controls = sceneControls(scene, controls);
  const mode = scene.defaultMode || "remove";
  return {
    mode,
    modeChosen: false,
    timeTouched: false,
    objectId: null,
    stepIndex: controls[mode]?.defaultIndex ?? 0,
    editFrame: nearestEditFrame(scene, scene.editTimeline?.defaultFrame ?? 1),
    timeChosen: !scene.editTimeline || Boolean(scene.parameterDemo),
  };
}

export function describeSelection(scene, controls, selection) {
  controls = sceneControls(scene, controls);
  const { mode, objectId, stepIndex, editFrame = 1 } = selection;
  if (scene.editTimeline && selection.timeChosen === false) return null;
  if (mode === "insert" && selection.positionChosen === false) return null;
  if (!modes.some(item => item.id === mode)) return null;
  const object = mode === "insert" ? scene.insertion?.object : editableObjects(scene, mode).find(item => item.id === objectId);
  if (!object) return null;
  const step = controls[mode]?.steps[stepIndex];
  if (mode !== "remove" && (!Number.isInteger(stepIndex) || !step)) return null;
  if (scene.editTimeline && (!Number.isInteger(editFrame) || editFrame < 1 || editFrame > scene.source.frameCount || !editableFrames(scene, mode).includes(editFrame))) return null;
  const baseKey = mode === "remove" ? `remove:${object.id}` : `${mode}:${object.id}:${step.id}`;
  const key = scene.editTimeline ? `${baseKey}:frame-${editFrame}` : baseKey;
  const name = object.label.toLowerCase();
  let instruction;
  if (mode === "remove") instruction = `Remove the ${name}.`;
  else if (mode === "insert" && scene.insertion.positions) instruction = `Add a ${name} at the ${step.label.toLowerCase()} position on the ${scene.insertion.surface || "book"}.`;
  else if (mode === "insert") instruction = `Add a ${name} at ${step.name ? "the center" : `${step.label} of the path`}.`;
  else if (mode === "velocity") instruction = `Set the ${name}'s ${editFrame === 1 ? 'initial velocity' : 'velocity'} to ${step.label} the source velocity.`;
  else if (mode === "mass") instruction = `Increase the ${name}'s mass to ${step.label} its original value.`;
  else if (mode === "friction") instruction = `Set the ${name}'s friction coefficient to ${step.label}.`;
  else if (mode === "gravity") instruction = `Set gravity to ${step.label} its original value.`;
  else instruction = controls.restitution.absolute ? (step.id === "original" ? `Keep the ${name}'s coefficient of restitution unchanged.` : `Set the ${name}'s coefficient of restitution to ${step.label}.`) : `Set the ${name}'s coefficient of restitution to ${step.label} its original value.`;
  if (scene.editTimeline) instruction = `${scene.parameterDemo ? `At ${interventionTime(scene, editFrame).toFixed(2)} s` : `From frame ${editFrame}`}, ${instruction[0].toLowerCase()}${instruction.slice(1)}`;
  return { key, mode, object, step, editFrame, instruction, clip: scene.variants?.[key] ?? null };
}

export function insertionObject(scene, fraction) {
  const { object, start, end } = scene.insertion;
  return {
    ...object,
    x: start.x + (end.x - start.x) * fraction,
    y: start.y + (end.y - start.y) * fraction - object.h / 2,
  };
}

export function listVariants(scene, controls) {
  controls = sceneControls(scene, controls);
  const selections = [];
  for (const mode of sceneModes(scene)) {
    if (mode.id === "insert") {
      if (scene.insertion) controls.insert.steps.forEach((_, stepIndex) => selections.push({ mode: "insert", objectId: null, stepIndex }));
      continue;
    }
    for (const object of editableObjects(scene, mode.id)) {
      if (mode.id === "remove") selections.push({ mode: "remove", objectId: object.id, stepIndex: 0 });
      else controls[mode.id].steps.forEach((_, stepIndex) => selections.push({ mode: mode.id, objectId: object.id, stepIndex }));
    }
  }
  return selections.flatMap(selection => editableFrames(scene, selection.mode).map(editFrame => describeSelection(scene, controls, { ...selection, editFrame })));
}

// Touch selection uses screen pixels so the tolerance stays small at every size.
export function nearestTouchObject(objects, frame, x, y, width, height, tolerance = 14) {
  let selected = null, best = tolerance;
  for (const source of objects) {
    const object = objectAtFrame(source, frame);
    const polygon = object.polygon || Array.from({ length: 24 }, (_, i) => {
      const angle = i / 24 * Math.PI * 2;
      return [object.x + Math.cos(angle) * object.w / 2, object.y + Math.sin(angle) * object.h / 2];
    });
    const points = polygon.map(([px, py]) => [px * width, py * height]);
    let inside = false, distance = Infinity;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[j], [bx, by] = points[i];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
      distance = Math.min(distance, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    if (inside) return source;
    if (distance < best) { best = distance; selected = source; }
  }
  return selected;
}
