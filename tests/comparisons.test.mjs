import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/comparisons.mjs', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

async function setup(visibleBeforeData = false) {
  const videos = [], observers = [];
  class Element {
    constructor() {
      this.children = []; this.events = {}; this.style = {}; this.dataset = {};
      this.duration = NaN; this.currentTime = 0; this.ended = false;
    }
    querySelector(selector) { return this.parts[selector]; }
    querySelectorAll() { return []; }
    setAttribute() {}
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    addEventListener(name, handler) { this.events[name] = handler; }
    pause() { this.paused = true; }
    load() {}
    removeAttribute() {}
    play() {
      this.playCalls = (this.playCalls || 0) + 1;
      this.paused = false;
      // Model a browser that supplies metadata only after play is requested.
      return Promise.resolve().then(() => {
        this.duration = 3;
        this.events.loadedmetadata?.();
      });
    }
  }
  const root = new Element(); root.id = 'synthetic-comparison';
  root.parts = Object.fromEntries(['grid', 'cases', 'instruction', 'play', 'seek', 'time', 'status'].map(name => ['.comparison-' + name, new Element()]));
  const document = {
    hidden: false, addEventListener() {},
    querySelector: selector => selector === '#synthetic-comparison' ? root : null,
    createElement: tag => { const element = new Element(); if (tag === 'video') videos.push(element); return element; }
  };
  const item = { id: 'one', label: 'One', instruction: 'Remove', videos: { source: 'source.mp4', vace: 'vace.mp4' }, posters: { source: 'source.jpg' } };
  vm.runInNewContext(source, {
    document, setTimeout, clearTimeout, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    fetch: async () => ({ ok: true, json: async () => ({ cases: [item, { ...item, id: 'two' }] }) }),
    IntersectionObserver: class {
      constructor(callback) { observers.push(callback); }
      observe() { if (visibleBeforeData) observers[0]([{ isIntersecting: true }]); }
    }
  });
  await settle();
  return { root, videos, enter: () => observers[0]([{ isIntersecting: true }]) };
}

test('entering comparison starts videos without waiting for preload metadata', async () => {
  const page = await setup();
  assert.ok(page.videos.every(video => Number.isNaN(video.duration)));
  page.enter(); await settle();
  assert.ok(page.videos.every(video => video.playCalls === 1));
  assert.equal(page.root.parts['.comparison-play'].textContent, 'Pause all');
  assert.equal(page.videos[0].poster, 'source.jpg');
});

test('data arriving after the comparison is visible also starts playback', async () => {
  const page = await setup(true);
  assert.ok(page.videos.every(video => video.playCalls === 1));
});

test('choosing another case starts its videos without an Open video click', async () => {
  const page = await setup();
  page.root.parts['.comparison-cases'].children[1].events.click(); await settle();
  assert.ok(page.videos.slice(2).every(video => video.playCalls === 1));
});

test('later metadata cannot reenable controls after a video error', async () => {
  const page = await setup(true);
  page.videos[0].events.error();
  page.videos[1].events.loadedmetadata();
  assert.equal(page.root.parts['.comparison-play'].disabled, true);
  assert.equal(page.root.parts['.comparison-seek'].disabled, true);
});
