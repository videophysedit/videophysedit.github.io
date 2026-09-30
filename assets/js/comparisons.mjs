async function initComparison(root, dataPath) {
  if (!root) return;
  const grid = root.querySelector(".comparison-grid");
  const choices = root.querySelector(".comparison-cases");
  const instruction = root.querySelector(".comparison-instruction");
  const play = root.querySelector(".comparison-play");
  const seek = root.querySelector(".comparison-seek");
  const clock = root.querySelector(".comparison-time");
  const status = root.querySelector(".comparison-status");
  const methods = [
    ["source", "Source", "source"],
    root.id === "removal-comparison" ? ["void", "VOID"] : ["vace", "VACE"], ["ditto", "Ditto"],
    ["minimax", "MiniMax H3"], ["seedance", "Seedance 2.5"],
    ["videophysedit", "VideoPhysEdit", "ours"]
  ];
  let videos = [], generation = 0, playback = 0, playing = false, frame = 0, time = 0, duration = 0;
  let selectedCase = null;
  let visible = false, manualPause = false, starting = false, failed = false;

  function autoplay() {
    if (visible && !document.hidden && !manualPause && !failed && videos.length) startPlayback();
  }

  function displayTime() {
    seek.value = time;
    clock.value = `${time.toFixed(1)} / ${duration.toFixed(1)} s`;
    seek.setAttribute("aria-valuetext", `${time.toFixed(1)} of ${duration.toFixed(1)} seconds`);
  }
  function pause() {
    playback++;
    starting = false;
    playing = false;
    cancelAnimationFrame(frame);
    videos.forEach(video => video.pause());
    play.disabled = failed || !videos.length;
    play.textContent = time >= duration && duration ? "Replay all" : "Play all";
  }
  function seekTo(value) {
    time = value;
    videos.forEach(video => {
      if (Number.isFinite(video.duration)) video.currentTime = Math.min(value, video.duration);
    });
    displayTime();
  }
  function metadataReady() {
    if (failed || !videos.length) return;
    const loaded = videos.filter(video => Number.isFinite(video.duration)).length;
    if (loaded < videos.length) {
      status.textContent = "Loading videos (" + loaded + "/" + videos.length + ")… You can tap Play all to start.";
      return;
    }
    duration = Math.max(...videos.map(video => video.duration));
    seek.max = duration;
    seek.disabled = false;
    play.disabled = starting;
    status.textContent = "";
    displayTime();
    autoplay();
  }
  function render(item) {
    selectedCase = item.id;
    generation++;
    pause();
    videos.forEach(video => { video.removeAttribute("src"); video.load(); });
    videos = [];
    time = duration = 0;
    manualPause = failed = false;
    play.textContent = "Play all";
    play.disabled = seek.disabled = true;
    status.textContent = "";
    instruction.replaceChildren();
    const action = /\b(remove|insert|add|increase|decrease|reduce|leave|set|change)\b/i.exec(item.instruction);
    if (action) {
      const verb = document.createElement("strong");
      verb.textContent = action[0];
      instruction.append(item.instruction.slice(0, action.index), verb, item.instruction.slice(action.index + action[0].length));
    } else {
      instruction.textContent = item.instruction;
    }
    choices.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.id === item.id)));
    grid.replaceChildren();
    const activeGeneration = generation;
    for (const [key, name, role] of methods) {
      const figure = document.createElement("figure");
      figure.className = `media-column${role ? ` is-${role}` : ""}`;
      const caption = document.createElement("figcaption");
      caption.textContent = name;
      const slot = document.createElement("div");
      slot.className = "media-slot";
      slot.style.aspectRatio = item.aspect || "16/9";
      figure.append(caption, slot);
      if (item.videos[key]) {
        const video = document.createElement("video");
        video.muted = true;
        video.defaultMuted = true;
        if (item.posters?.[key]) video.poster = item.posters[key];
        video.playsInline = true;
        video.preload = "auto";
        video.setAttribute("aria-label", `${item.label} — ${name}`);
        video.addEventListener("loadedmetadata", () => { if (activeGeneration === generation) metadataReady(); });
        video.addEventListener("error", () => {
          if (activeGeneration !== generation) return;
          failed = true;
          pause();
          status.textContent = `${name} could not be loaded. Please reload the page.`;
          play.disabled = seek.disabled = true;
        });
        video.src = item.videos[key];
        videos.push(video);
        slot.append(video);
        const link = document.createElement("a");
        link.className = "comparison-open";
        link.href = item.videos[key];
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Open video ↗";
        link.setAttribute("aria-label", `Open ${name} video for ${item.label}`);
        figure.append(link);
      } else {
        const pending = document.createElement("span");
        pending.className = "placeholder-content";
        pending.textContent = "Video coming soon";
        slot.append(pending);
      }
      grid.append(figure);
    }
    play.disabled = !videos.length;
    status.textContent = "Loading videos… You can tap Play all to start.";
    displayTime();
    autoplay();
  }
  async function startPlayback() {
    if (playing || starting || failed || !videos.length) return;
    starting = true;
    if (duration > 0 && time >= duration) seekTo(0);
    const activeGeneration = generation;
    const activeVideos = [...videos];
    const activePlayback = ++playback;
    status.textContent = "";
    play.disabled = true;
    play.textContent = "Loading…";
    let loadTimeout;
    try {
      // Calling play directly also starts loading when mobile browsers defer preload.
      await Promise.race([
        Promise.all(activeVideos.filter(video => !Number.isFinite(video.duration) || video.currentTime < video.duration).map(video => video.play())),
        new Promise((_, reject) => { loadTimeout = setTimeout(() => reject(new Error("Video loading timed out")), 15000); })
      ]);
      if (activeGeneration !== generation || activePlayback !== playback) return;
      metadataReady();
      starting = false;
      playing = true;
      play.disabled = false;
      play.textContent = "Pause all";
      // Native playback owns each clip's progress. Do not seek, pause, or
      // reissue play() to chase another decoder while a group is running.
      function tick() {
        if (!playing || activeGeneration !== generation || activePlayback !== playback) return;
        const unfinished = activeVideos.filter(video => !video.ended);
        time = unfinished.length ? Math.min(...unfinished.map(video => video.currentTime)) : duration;
        displayTime();
        if (activeVideos.every(video => video.ended)) {
          pause();
          seekTo(0);
          autoplay();
          return;
        }
        frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    } catch {
      if (activeGeneration !== generation || activePlayback !== playback) return;
      pause();
      manualPause = true;
      play.disabled = false;
      status.textContent = "Videos are still loading or autoplay was blocked. Tap Play all to retry.";
    } finally {
      clearTimeout(loadTimeout);
    }
  }
  play.addEventListener("click", () => {
    if (playing) { manualPause = true; pause(); }
    else { manualPause = false; startPlayback(); }
  });
  seek.addEventListener("input", () => { manualPause = true; seekTo(Number(seek.value)); pause(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else autoplay();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) autoplay();
    else pause();
  }).observe(grid);

  try {
    const response = await fetch(dataPath);
    if (!response.ok) throw new Error("Comparison data unavailable");
    const data = await response.json();
    data.cases.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.id = item.id;
      button.textContent = item.label;
      button.addEventListener("click", () => {
        if (selectedCase !== item.id) render(item);
        startPlayback();
      });
      choices.append(button);
    });
    render(data.cases[0]);
  } catch {
    status.textContent = "Comparisons could not be loaded. Please reload the page.";
  }

}
for (const kind of ["synthetic", "real", "removal"]) {
  initComparison(document.querySelector(`#${kind}-comparison`), `assets/data/${kind}-comparison.json?v=removal-order-116`);
}
