export const modes = [
  { id: "remove", label: "Remove", icon: "minus" },
  { id: "insert", label: "Insert", icon: "plus" },
  { id: "velocity", label: "Velocity", icon: "arrow" },
  { id: "friction", label: "Friction", icon: "surface" },
  { id: "restitution", label: "Restitution", icon: "bounce" },
];

export function editableObjects(scene, mode) {
  return scene.objects.filter(object => object.edits.includes(mode));
}

export function initialSelection(scene, controls) {
  const mode = scene.defaultMode || "remove";
  return {
    mode,
    objectId: mode === "remove" || mode === "insert" ? null : editableObjects(scene, mode)[0]?.id,
    stepIndex: controls[mode]?.defaultIndex ?? 0,
  };
}

export function describeSelection(scene, controls, selection) {
  const { mode, objectId, stepIndex } = selection;
  if (!modes.some(item => item.id === mode)) return null;
  const object = mode === "insert" ? scene.insertion?.object : editableObjects(scene, mode).find(item => item.id === objectId);
  if (!object) return null;
  const step = controls[mode]?.steps[stepIndex];
  if (mode !== "remove" && (!Number.isInteger(stepIndex) || !step)) return null;
  const key = mode === "remove" ? `remove:${object.id}` : `${mode}:${object.id}:${step.id}`;
  const name = object.label.toLowerCase();
  let instruction;
  if (mode === "remove") instruction = `Remove the ${name}.`;
  else if (mode === "insert") instruction = `Add a ${name} at ${step.name ? "the center" : `${step.label} of the path`}.`;
  else if (mode === "velocity") instruction = `Set the ${name}'s initial velocity to ${step.label} the source velocity.`;
  else if (mode === "friction") instruction = `Set the ${name}'s friction coefficient to ${step.label}.`;
  else instruction = `Set the ${name}'s coefficient of restitution to ${step.label}.`;
  return { key, mode, object, step, instruction, clip: scene.variants?.[key] ?? null };
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
  const selections = [];
  for (const mode of modes) {
    if (mode.id === "insert") {
      if (scene.insertion) controls.insert.steps.forEach((_, stepIndex) => selections.push({ mode: "insert", objectId: null, stepIndex }));
      continue;
    }
    for (const object of editableObjects(scene, mode.id)) {
      if (mode.id === "remove") selections.push({ mode: "remove", objectId: object.id, stepIndex: 0 });
      else controls[mode.id].steps.forEach((_, stepIndex) => selections.push({ mode: mode.id, objectId: object.id, stepIndex }));
    }
  }
  return selections.map(selection => describeSelection(scene, controls, selection));
}
