import { modes, editableObjects, initialSelection, describeSelection, insertionObject } from "./demo-model.mjs?v=interactive-1";

const root = document.querySelector("#interactive-demo");
const escapeText = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const icons = {
  minus: '<path d="M5 10h10"/>', plus: '<path d="M5 10h10M10 5v10"/>',
  arrow: '<path d="M3 10h13m-5-5 5 5-5 5"/>',
  surface: '<path d="M3 14h14M5 17l2-3m3 3 2-3m3 3 2-3M7 4h6v7H7z"/>',
  bounce: '<path d="M3 16h14M5 3v7c0 5 8 5 8 0V6m-3 3 3-3 3 3"/>',
  play: '<path d="m7 4 9 6-9 6z"/>', pause: '<path d="M7 4v12M13 4v12"/>',
  reset: '<path d="M4 8a6 6 0 1 1 1 7M4 3v5h5"/>',
};
const icon = name => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const colors = {
  blue: ["#d7efff", "#629ac5", "#315f84"],
  amber: ["#ffe4b1", "#d7a55b", "#a1753d"],
  slate: ["#edf0f5", "#a5b1c0", "#697b91"],
  teal: ["#d9f2e9", "#7bb9a2", "#407f69"],
};

function insertionGuide(scene, descriptor) {
  if (descriptor?.mode !== "insert") return "";
  const { start, end } = scene.insertion;
  const object = insertionObject(scene, descriptor.step.value);
  const x = object.x * 720, y = object.y * 405, w = object.w * 720, h = object.h * 405;
  const shape = object.shape === "sphere"
    ? `<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}"/>`
    : `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="3"/>`;
  const stops = [1/6, 1/3, 1/2, 2/3, 5/6].map(fraction => {
    const point = insertionObject(scene, fraction);
    return `<circle cx="${point.x*720}" cy="${(point.y+point.h/2)*405}" r="4" fill="white" stroke="#568775" stroke-width="2"/>`;
  }).join("");
  return `<svg viewBox="0 0 720 405" aria-hidden="true"><path d="M${start.x*720} ${start.y*405}L${end.x*720} ${end.y*405}" stroke="#568775" stroke-width="2" stroke-dasharray="5 6"/>${stops}<g fill="#98c8b68c" stroke="#407f69" stroke-width="2" stroke-dasharray="5 4">${shape}</g><g transform="translate(${x-44} ${y-h/2-27})"><rect width="88" height="23" rx="5" fill="#f5fff9" stroke="#acd0be"/><text x="44" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#407f69">New ${escapeText(object.label.toLowerCase())}</text></g></svg>`;
}

function sceneMarkup(scene, descriptor, prefix, result = false) {
  const objects = scene.objects.filter(object => !(result && descriptor?.mode === "remove" && descriptor.object.id === object.id));
  const defs = Object.entries(colors).map(([name, palette]) => `<radialGradient id="${prefix}-${name}" cx="32%" cy="24%" r="76%"><stop stop-color="${palette[0]}"/><stop offset=".5" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></radialGradient>`).join("");
  function shape(object, ghost = false) {
    const x = object.x * 720, y = object.y * 405, w = object.w * 720, h = object.h * 405;
    const palette = colors[object.color] || colors.blue;
    const shadow = `<ellipse cx="${x + 6}" cy="${y + h / 2 + 6}" rx="${w * .57}" ry="${w * .12}" fill="#536478" opacity=".14"/>`;
    const body = object.shape === "sphere"
      ? `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="url(#${prefix}-${object.color})"/><ellipse cx="${x - w * .17}" cy="${y - h * .22}" rx="${w * .1}" ry="${h * .065}" fill="white" opacity=".35"/>`
      : `<path d="M${x-w/2},${y-h/2} l${w},0 0,${h} -${w},0z" fill="${palette[1]}"/><path d="M${x-w/2},${y-h/2} l${w*.22},${-w*.17} ${w},0 ${-w*.22},${w*.17}z" fill="${palette[0]}"/><path d="M${x+w/2},${y-h/2} l${w*.22},${-w*.17} 0,${h} ${-w*.22},${w*.17}z" fill="${palette[2]}"/>`;
    return `<g opacity="${ghost ? .62 : 1}">${shadow}${body}</g>`;
  }
  let backdrop = '<path d="M38 278 647 251 709 358 92 389z" fill="#e9e8e1"/><path d="m38 278 54 111 0 8-54-111z" fill="#d5d8d5"/><path d="m92 389 617-31v8L92 397z" fill="#cbd1cf"/><path d="m113 279 498-22M142 309l497-25M166 343l497-24" stroke="white" opacity=".52"/>';
  if (scene.illustration === "ramp") backdrop += '<path d="m99 310 451-166 47 20-450 177z" fill="#c8d2dc"/><path d="m147 341 450-177 0 131-450 56z" fill="#91a2b5"/><path d="m120 306 430-158" stroke="white" stroke-width="2" opacity=".7"/>';
  if (scene.illustration === "bounce") backdrop += '<path d="M259 191v92" stroke="#b4c1ce" stroke-width="2" stroke-dasharray="5 8"/><ellipse cx="264" cy="294" rx="34" ry="8" fill="#7c94ab" opacity=".12"/>';
  let addition = "";
  if (descriptor?.mode === "insert") {
    const { start, end } = scene.insertion;
    if (!result) {
      addition += `<path d="M${start.x*720} ${start.y*405}L${end.x*720} ${end.y*405}" stroke="#669b87" stroke-width="2" stroke-dasharray="5 6"/>`;
      for (const fraction of [1/6, 1/3, 1/2, 2/3, 5/6]) {
        const point = insertionObject(scene, fraction);
        addition += `<circle cx="${point.x*720}" cy="${(point.y+point.h/2)*405}" r="4" fill="#f5fbf8" stroke="#669b87" stroke-width="2"/>`;
      }
    }
    addition += shape(insertionObject(scene, descriptor.step.value), !result);
  }
  let annotation = "";
  if (result && descriptor && !["remove", "insert"].includes(descriptor.mode)) {
    const x = descriptor.object.x * 720, y = descriptor.object.y * 405;
    const label = descriptor.mode === "velocity" ? `v₀ × ${descriptor.step.value}` : `${descriptor.mode === "friction" ? "μ" : "e"} = ${descriptor.step.label}`;
    annotation = `<g transform="translate(${Math.min(568, Math.max(35,x-50))} ${Math.max(35,y-75)})"><rect width="104" height="31" rx="15" fill="#fff" stroke="#c4d4e1"/><text x="52" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#315f84">${escapeText(label)}</text></g>`;
  }
  return `<svg viewBox="0 0 720 405" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>${defs}<linearGradient id="${prefix}-bg" x2="0" y2="1"><stop stop-color="#f7f9fc"/><stop offset="1" stop-color="#edf1f5"/></linearGradient></defs><rect width="720" height="405" fill="url(#${prefix}-bg)"/><path d="M0 257h720" stroke="#dfe5eb"/>${backdrop}${objects.map(object => shape(object)).join("")}${addition}${annotation}</svg>`;
}

async function initialize() {
  const response = await fetch(root.dataset.config);
  if (!response.ok) throw new Error("Unable to load demo configuration");
  const config = await response.json();
  if (!config.scenes?.length) throw new Error("No demo scenes configured");
  const savedSelections = new Map();
  let scene = config.scenes[0];
  let selection;
  let descriptor;
  let loadedResultKey = null;
  let playing = false;
  let playVersion = 0;
  let animationFrame = 0;
  let sourceFailed = false;
  let resultFailed = false;

  root.innerHTML = `
    <div class="demo-scenes" role="tablist" aria-label="Demo scenes">${config.scenes.map((item, index) => `<button type="button" role="tab" id="demo-tab-${item.id}" aria-controls="demo-workspace" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" class="demo-scene-tab" data-scene="${item.id}"><span class="demo-scene-thumb">${sceneMarkup(item, null, `thumb-${item.id}`)}</span><span><strong>${escapeText(item.title)}</strong><small>${escapeText(item.subtitle)}</small></span><span class="demo-scene-number">0${index + 1}</span></button>`).join("")}</div>
    <div class="demo-workspace" id="demo-workspace" role="tabpanel" aria-labelledby="demo-tab-${scene.id}">
      <div class="demo-comparison">
        <figure class="demo-view">
          <figcaption><span>Source video</span><small id="demo-source-hint">Click an object</small></figcaption>
          <div class="demo-stage" id="demo-source-stage">
            <div class="demo-illustration" id="demo-source-illustration"></div>
            <video id="demo-source-video" muted playsinline preload="metadata" hidden aria-label="Source video"></video>
            <span class="demo-preview-label" id="demo-source-label">Illustration</span>
            <div class="demo-insertion-overlay" id="demo-insertion-overlay" aria-hidden="true" hidden></div>
            <div class="demo-hotspots" id="demo-hotspots" role="group" aria-label="Objects in the source scene"></div>
            <button class="demo-return" id="demo-return" type="button" data-action="edit-frame" hidden>Edit this scene</button>
          </div>
        </figure>
        <figure class="demo-view demo-view-result">
          <figcaption><span>VideoPhysEdit</span><small id="demo-result-hint">Counterfactual video</small></figcaption>
          <div class="demo-stage" id="demo-result-stage">
            <div class="demo-illustration" id="demo-result-illustration"></div>
            <video id="demo-result-video" muted playsinline preload="metadata" hidden aria-label="VideoPhysEdit result"></video>
            <span class="demo-preview-label" id="demo-result-label">Edit preview</span>
            <div class="demo-start-hint" id="demo-start-hint"><span>${icon("minus")}</span><strong>What would happen without it?</strong><p>Click an object in the source scene.</p></div>
            <span class="demo-pending" id="demo-pending" hidden>Result video coming soon</span>
          </div>
        </figure>
      </div>
      <aside class="demo-controls" aria-label="Physical edit controls">
        <div class="demo-controls-heading"><h3>Physical edit</h3><button type="button" class="demo-reset" data-action="reset" title="Reset this scene" aria-label="Reset edit">${icon("reset")}</button></div>
        <div class="demo-mode-list" role="group" aria-label="Edit type">${modes.map(mode => `<button class="demo-mode" type="button" data-mode="${mode.id}" aria-pressed="false">${icon(mode.icon)}${mode.label}</button>`).join("")}</div>
        <div class="demo-target" id="demo-target"><span class="demo-field-label">Object</span><div class="demo-object-list" id="demo-object-list" role="group" aria-label="Target object"></div></div>
        <div class="demo-remove-help" id="demo-remove-help">Click an object to remove it. Click again to restore it.</div>
        <div class="demo-slider-control" id="demo-slider-control" hidden>
          <div class="demo-slider-heading"><label for="demo-value" id="demo-value-label"></label><output for="demo-value" id="demo-value-output"></output></div>
          <input id="demo-value" class="demo-range" type="range" min="0" max="4" step="1" value="2">
          <div class="demo-ticks" id="demo-ticks"></div>
          <p class="demo-control-hint" id="demo-control-hint"></p>
        </div>
        <p class="demo-command" id="demo-command" aria-live="polite"></p>
      </aside>
    </div>
    <div class="demo-playback" role="group" aria-label="Comparison playback">
      <button class="demo-play" id="demo-play" type="button" data-action="play" disabled>${icon("play")}<span>Play comparison</span></button>
      <input class="demo-timeline" id="demo-timeline" type="range" min="0" max="1000" value="0" step="1" aria-label="Comparison timeline" disabled>
      <span class="demo-time" id="demo-time">0:00 / —</span>
      <p class="demo-media-status" id="demo-media-status" role="status">Interaction preview · videos coming soon</p>
    </div>`;
  root.removeAttribute("aria-busy");
  const find = id => root.querySelector(`#${id}`);
  const sourceVideo = find("demo-source-video");
  const resultVideo = find("demo-result-video");
  const range = find("demo-value");
  const timeline = find("demo-timeline");
  const playButton = find("demo-play");
  const stageSource = find("demo-source-stage");
  const stageResult = find("demo-result-stage");
  const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  function stopPlayback() {
    playVersion++;
    playing = false;
    cancelAnimationFrame(animationFrame);
    sourceVideo.pause();
    resultVideo.pause();
    root.classList.remove("is-playing");
    playButton.innerHTML = `${icon("play")}<span>Play comparison</span>`;
  }

  function duration() {
    const values = [sourceVideo.duration, resultVideo.duration];
    return values.every(value => Number.isFinite(value) && value > 0) ? Math.min(...values) : 0;
  }

  function currentResultReady(minimumState = 2) {
    return descriptor?.clip?.video && loadedResultKey === descriptor.key && !resultFailed && resultVideo.readyState >= minimumState;
  }

  function ready() {
    return Boolean(scene.source.video && !sourceFailed && sourceVideo.readyState >= 1 && currentResultReady(1) && duration());
  }

  function updateHotspotVisibility() {
    const atEditFrame = !scene.source.video || (!sourceFailed && sourceVideo.readyState >= 1 && Math.abs(sourceVideo.currentTime - scene.source.editTime) < .1);
    const interactive = !playing && atEditFrame;
    find("demo-hotspots").hidden = !interactive || selection.mode === "insert";
    find("demo-insertion-overlay").hidden = !interactive || selection.mode !== "insert";
    find("demo-return").hidden = interactive || playing || sourceFailed;
    find("demo-source-hint").textContent = playing ? "Playing in sync" : selection.mode === "insert" ? "Choose a position" : "Click an object";
  }

  function updateMediaState() {
    const sourceReady = scene.source.video && !sourceFailed && sourceVideo.readyState >= 2;
    const resultReady = currentResultReady();
    sourceVideo.hidden = !sourceReady;
    find("demo-source-illustration").hidden = Boolean(sourceReady);
    resultVideo.hidden = !resultReady;
    find("demo-result-illustration").hidden = Boolean(resultReady);
    find("demo-source-label").hidden = Boolean(sourceReady);
    find("demo-source-label").textContent = scene.source.video ? (sourceFailed ? "Video unavailable" : "Loading video…") : "Illustration";
    find("demo-result-label").hidden = Boolean(resultReady);
    find("demo-start-hint").hidden = Boolean(descriptor);
    find("demo-pending").hidden = !descriptor || Boolean(resultReady);
    find("demo-pending").textContent = resultFailed ? "Video unavailable" : descriptor?.clip?.video ? "Loading result…" : "Result video coming soon";
    const playable = ready();
    playButton.disabled = !playable;
    timeline.disabled = !playable;
    playButton.title = playable ? "Play source and result together" : "Comparison video coming soon";
    const status = find("demo-media-status");
    status.textContent = sourceFailed || resultFailed ? "This video could not be loaded." : !scene.source.video ? "Interaction preview · videos coming soon" : !descriptor ? "Choose a physical edit to compare." : !descriptor.clip?.video ? "No video has been added for this edit yet." : playable ? "Source and result play together" : "Loading comparison…";
    updateHotspotVisibility();
    updateTime();
  }

  function updateTime() {
    const length = duration();
    const time = ready() ? Math.min(sourceVideo.currentTime, length) : 0;
    timeline.value = length && ready() ? String(Math.round(time / length * 1000)) : "0";
    find("demo-time").textContent = `${formatTime(time)} / ${ready() ? formatTime(length) : "—"}`;
  }

  function setMedia(video, url, poster) {
    video.pause();
    video.hidden = true;
    video.removeAttribute("src");
    video.removeAttribute("poster");
    if (poster) video.poster = poster;
    if (url) video.src = url;
    video.load();
  }

  function showEditFrame() {
    stopPlayback();
    if (scene.source.video && sourceVideo.readyState >= 1 && Math.abs(sourceVideo.currentTime - scene.source.editTime) > .02) sourceVideo.currentTime = Math.min(scene.source.editTime, sourceVideo.duration || 0);
    if (resultVideo.readyState >= 1 && resultVideo.currentTime > .02) resultVideo.currentTime = 0;
    updateHotspotVisibility();
  }

  function paintScenes() {
    const sourceIllustration = find("demo-source-illustration");
    sourceIllustration.innerHTML = scene.source.poster
      ? `<img src="${escapeText(scene.source.poster)}" alt="Source scene at the physical intervention frame">`
      : sceneMarkup(scene, null, "source");
    find("demo-insertion-overlay").innerHTML = insertionGuide(scene, descriptor);
    const resultIllustration = find("demo-result-illustration");
    resultIllustration.innerHTML = descriptor?.clip?.poster
      ? `<img src="${escapeText(descriptor.clip.poster)}" alt="Preview of the selected physical edit">`
      : sceneMarkup(scene, descriptor, "result", true);
    resultIllustration.classList.toggle("is-unselected", !descriptor);
  }

  function updateSelection(commit = true) {
    showEditFrame();
    descriptor = describeSelection(scene, config.controls, selection);
    root.dataset.variant = descriptor?.key || "";
    savedSelections.set(scene.id, { ...selection });
    find("demo-command").textContent = descriptor?.instruction || "Click an object in the source scene to remove it.";
    find("demo-result-hint").textContent = descriptor ? modes.find(mode => mode.id === selection.mode).label : "Counterfactual video";
    root.querySelectorAll("[data-object]").forEach(button => {
      const selected = button.dataset.object === selection.objectId;
      button.setAttribute("aria-pressed", String(selected));
      if (button.classList.contains("demo-hotspot")) {
        button.classList.toggle("is-removal", selected && selection.mode === "remove");
        const object = scene.objects.find(item => item.id === button.dataset.object);
        button.setAttribute("aria-label", `${selected && selection.mode === "remove" ? "Restore" : selection.mode === "remove" ? "Remove" : "Select"} ${object.label.toLowerCase()}`);
      }
    });
    if (selection.mode !== "remove") {
      const step = config.controls[selection.mode].steps[selection.stepIndex];
      range.value = String(selection.stepIndex);
      range.style.setProperty("--range-progress", `${selection.stepIndex / (config.controls[selection.mode].steps.length - 1) * 100}%`);
      range.setAttribute("aria-valuetext", `${step.label}${step.name ? `, ${step.name}` : ""}`);
      find("demo-value-output").textContent = `${step.label}${step.name ? ` · ${step.name}` : ""}`;
      root.querySelectorAll("[data-step]").forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.step) === selection.stepIndex)));
    }
    paintScenes();
    if (commit) {
      const nextKey = descriptor?.key || null;
      if (nextKey !== loadedResultKey) {
        loadedResultKey = nextKey;
        resultFailed = false;
        setMedia(resultVideo, descriptor?.clip?.video, descriptor?.clip?.poster);
      }
    }
    updateMediaState();
  }

  function renderControls() {
    root.querySelectorAll("[data-mode]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === selection.mode));
      button.disabled = button.dataset.mode === "insert" ? !scene.insertion : !editableObjects(scene, button.dataset.mode).length;
    });
    const objects = editableObjects(scene, selection.mode);
    find("demo-target").hidden = selection.mode === "insert";
    find("demo-object-list").innerHTML = objects.map(object => `<button type="button" class="demo-object" data-object="${object.id}" aria-pressed="false"><span class="demo-object-dot" style="background:${(colors[object.color] || colors.blue)[1]}"></span>${escapeText(object.label)}</button>`).join("");
    find("demo-hotspots").innerHTML = objects.map(object => `<button type="button" class="demo-hotspot ${object.shape === "sphere" ? "is-sphere" : ""}" data-object="${object.id}" aria-pressed="false" aria-label="Select ${escapeText(object.label.toLowerCase())}" title="${escapeText(object.label)}" style="left:${object.x*100}%;top:${object.y*100}%;width:${object.w*100+3}%;height:${object.h*100+5}%"><span aria-hidden="true">${selection.mode === "remove" ? "−" : "+"}</span></button>`).join("");
    const isRemoval = selection.mode === "remove";
    find("demo-remove-help").hidden = !isRemoval;
    find("demo-slider-control").hidden = isRemoval;
    if (!isRemoval) {
      const control = config.controls[selection.mode];
      range.max = String(control.steps.length - 1);
      find("demo-value-label").textContent = control.label;
      find("demo-control-hint").textContent = control.hint;
      find("demo-ticks").innerHTML = control.steps.map((step, index) => `<button type="button" data-step="${index}" aria-label="Set ${escapeText(control.label.toLowerCase())} to ${escapeText(step.label)}" aria-pressed="false">${escapeText(step.label)}</button>`).join("");
    }
    updateSelection();
  }

  function selectScene(id) {
    stopPlayback();
    scene = config.scenes.find(item => item.id === id);
    if (!scene) return;
    selection = savedSelections.get(scene.id) || initialSelection(scene, config.controls);
    descriptor = null;
    loadedResultKey = null;
    sourceFailed = false;
    resultFailed = false;
    root.dataset.scene = scene.id;
    root.querySelectorAll("[data-scene]").forEach(button => {
      const selected = button.dataset.scene === scene.id;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    find("demo-workspace").setAttribute("aria-labelledby", `demo-tab-${scene.id}`);
    for (const stage of [stageSource, stageResult]) stage.style.aspectRatio = `${scene.source.width} / ${scene.source.height}`;
    setMedia(sourceVideo, scene.source.video, scene.source.poster);
    setMedia(resultVideo, null, null);
    renderControls();
  }

  async function togglePlayback() {
    if (playing) {
      stopPlayback();
      updateHotspotVisibility();
      return;
    }
    if (!ready()) return;
    if (sourceVideo.currentTime >= duration() - .05) sourceVideo.currentTime = 0;
    resultVideo.currentTime = sourceVideo.currentTime;
    const version = ++playVersion;
    try {
      await Promise.all([sourceVideo.play(), resultVideo.play()]);
      if (version !== playVersion) return;
      playing = true;
      root.classList.add("is-playing");
      playButton.innerHTML = `${icon("pause")}<span>Pause comparison</span>`;
      updateHotspotVisibility();
      function tick() {
        if (!playing) return;
        if (sourceVideo.currentTime >= duration() - .04 || sourceVideo.ended || resultVideo.ended) {
          stopPlayback();
          updateTime();
          updateHotspotVisibility();
          return;
        }
        if (Math.abs(sourceVideo.currentTime - resultVideo.currentTime) > .12) resultVideo.currentTime = sourceVideo.currentTime;
        updateTime();
        animationFrame = requestAnimationFrame(tick);
      }
      animationFrame = requestAnimationFrame(tick);
    } catch {
      if (version !== playVersion) return;
      stopPlayback();
      find("demo-media-status").textContent = "Playback could not start. Please try again.";
    }
  }

  root.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.scene) selectScene(button.dataset.scene);
    else if (button.dataset.mode) {
      selection.mode = button.dataset.mode;
      selection.stepIndex = config.controls[selection.mode]?.defaultIndex ?? 0;
      if (!editableObjects(scene, selection.mode).some(object => object.id === selection.objectId)) selection.objectId = selection.mode === "remove" || selection.mode === "insert" ? null : editableObjects(scene, selection.mode)[0]?.id;
      renderControls();
    } else if (button.dataset.object) {
      selection.objectId = selection.mode === "remove" && selection.objectId === button.dataset.object ? null : button.dataset.object;
      updateSelection();
    } else if (button.dataset.step !== undefined) {
      selection.stepIndex = Number(button.dataset.step);
      updateSelection();
    } else if (button.dataset.action === "reset") {
      selection = initialSelection(scene, config.controls);
      renderControls();
    } else if (button.dataset.action === "edit-frame") showEditFrame();
    else if (button.dataset.action === "play") togglePlayback();
  });
  root.querySelector(".demo-scenes").addEventListener("keydown", event => {
    const index = config.scenes.findIndex(item => item.id === scene.id);
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % config.scenes.length;
    else if (event.key === "ArrowLeft") next = (index + config.scenes.length - 1) % config.scenes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = config.scenes.length - 1;
    else return;
    event.preventDefault();
    selectScene(config.scenes[next].id);
    find(`demo-tab-${scene.id}`).focus();
  });
  range.addEventListener("input", () => {
    selection.stepIndex = Number(range.value);
    updateSelection(false);
  });
  range.addEventListener("change", () => updateSelection(true));
  timeline.addEventListener("input", () => {
    if (!ready()) return;
    stopPlayback();
    const time = Number(timeline.value) / 1000 * duration();
    sourceVideo.currentTime = time;
    resultVideo.currentTime = time;
    updateTime();
    updateHotspotVisibility();
  });
  for (const video of [sourceVideo, resultVideo]) {
    video.addEventListener("loadedmetadata", updateMediaState);
    video.addEventListener("loadeddata", updateMediaState);
    video.addEventListener("seeked", updateMediaState);
    video.addEventListener("error", () => {
      if (!video.getAttribute("src")) return;
      if (video === sourceVideo) sourceFailed = true;
      else resultFailed = true;
      stopPlayback();
      updateMediaState();
    });
  }
  sourceVideo.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(sourceVideo.duration)) sourceVideo.currentTime = Math.min(scene.source.editTime, sourceVideo.duration);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stopPlayback(); updateHotspotVisibility(); }
  });
  window.addEventListener("pagehide", stopPlayback);
  selectScene(scene.id);
}

if (root) initialize().catch(error => {
  root.removeAttribute("aria-busy");
  root.innerHTML = '<p class="demo-load-error">The interactive preview could not load. <button type="button">Try again</button></p>';
  root.querySelector("button").addEventListener("click", () => location.reload());
  console.error(error);
});
