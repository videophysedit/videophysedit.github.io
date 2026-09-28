async function initComparison(root, dataPath) {
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
let visible = false, manualPause = false, starting = false, failed = false;

function autoplay() {
  if (visible && !document.hidden && !manualPause && !failed && duration > 0) startPlayback();
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
  if (duration > 0) play.disabled = false;
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
  if (!videos.length || videos.some(video => !Number.isFinite(video.duration))) return;
  duration = Math.max(...videos.map(video => video.duration));
  seek.max = duration;
  seek.disabled = false;
  play.disabled = false;
  displayTime();
  autoplay();
}
function render(item) {
  generation++;
  pause();
  videos.forEach(video => { video.removeAttribute("src"); video.load(); });
  videos = [];
  time = duration = 0;
  manualPause = failed = false;
  play.textContent = "Play all";
  play.disabled = seek.disabled = true;
  status.textContent = "";
  instruction.textContent = item.instruction;
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
      video.playsInline = true;
      video.preload = visible ? "auto" : "none";
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
  displayTime();
}
async function startPlayback() {
  if (playing || starting || failed || !duration) return;
  starting = true;
  if (time >= duration) seekTo(0);
  const activeGeneration = generation;
  const activeVideos = [...videos];
  const activePlayback = ++playback;
  status.textContent = "";
  play.disabled = true;
  play.textContent = "Loading…";
  try {
    await Promise.all(activeVideos.filter(video => time < video.duration).map(video => video.play()));
    if (activeGeneration !== generation || activePlayback !== playback) return;
    starting = false;
    playing = true;
    play.disabled = false;
    play.textContent = "Pause all";
    // The longest clip is the clock. Shorter clips hold their last frame.
    const leader = activeVideos.reduce((a, b) => a.duration > b.duration ? a : b);
    function tick() {
      if (!playing || activeGeneration !== generation) return;
      time = leader.currentTime;
      activeVideos.forEach(video => {
        const target = Math.min(time, video.duration);
        if (Math.abs(video.currentTime - target) > 0.15) video.currentTime = target;
      });
      displayTime();
      if (leader.ended) {
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
    status.textContent = "Playback could not start. Please try again.";
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
  if (visible) {
    videos.forEach(video => {
      if (video.preload === "none") { video.preload = "auto"; video.load(); }
    });
    autoplay();
  }
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
    button.addEventListener("click", () => render(item));
    choices.append(button);
  });
  render(data.cases[0]);
} catch {
  status.textContent = "Comparisons could not be loaded. Please reload the page.";
}

}
for (const kind of ["synthetic", "real", "removal"]) {
  initComparison(document.querySelector(`#${kind}-comparison`), `assets/data/${kind}-comparison.json?v=instructions-49`);
}
