(() => {
  const demo = document.querySelector('#interactive-demo');
  const section = document.querySelector('#teaser');
  const container = section?.querySelector('.wide-container');
  const header = document.querySelector('.site-header');
  if (!demo || !container) return;

  function fitDemo() {
    container.style.removeProperty('width');
    if (window.innerWidth <= 900 || demo.hasAttribute('aria-busy')) return;
    const available = window.innerHeight - header.getBoundingClientRect().height - 32;
    const maximum = Math.min(document.documentElement.clientWidth, 1840);
    container.style.width = maximum + 'px';
    if (demo.getBoundingClientRect().height <= available) return;
    let lower = Math.min(760, maximum), upper = maximum;
    for (let i = 0; i < 10; i++) {
      const width = (lower + upper) / 2;
      container.style.width = width + 'px';
      if (demo.getBoundingClientRect().height > available) upper = width;
      else lower = width;
    }
    container.style.width = Math.floor(lower) + 'px';
  }

  function centerDemo() {
    fitDemo();
    const bounds = demo.getBoundingClientRect();
    const headerHeight = header.getBoundingClientRect().height;
    const gap = Math.max(12, (window.innerHeight - headerHeight - bounds.height) / 2);
    window.scrollTo({ top: window.scrollY + bounds.top - headerHeight - gap,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  document.querySelectorAll('a[href="#teaser"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      history.replaceState(null, '', '#teaser');
      centerDemo();
    });
  });
  let pending;
  function scheduleFit() {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(fitDemo);
  }
  window.addEventListener('resize', scheduleFit, { passive: true });
  new MutationObserver(scheduleFit).observe(demo, {
    attributes: true, attributeFilter: ['aria-busy', 'class', 'data-variant']
  });
  document.fonts.ready.then(fitDemo);
  fitDemo();
})();
