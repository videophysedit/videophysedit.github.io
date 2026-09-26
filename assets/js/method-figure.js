const figure = document.querySelector("[data-pdf-figure]");

if (figure) {
  const preview = figure.querySelector("img");
  let page;
  let activeRender;
  let renderVersion = 0;
  let renderedSize = "";

  async function renderFigure() {
    const width = figure.clientWidth;
    if (!page || !width) return;
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
    const size = `${width}:${pixelRatio}`;
    if (size === renderedSize) return;
    renderedSize = size;
    const version = ++renderVersion;
    activeRender?.cancel();

    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width * pixelRatio);
    canvas.height = Math.ceil(viewport.height * pixelRatio);
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", preview.alt);

    try {
      activeRender = page.render({
        canvas,
        viewport,
        transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
      });
      await activeRender.promise;
      if (version !== renderVersion) return;
      figure.querySelector("canvas").replaceWith(canvas);
      preview.hidden = true;
      figure.dataset.pdfRendered = "true";
    } catch (error) {
      if (error.name === "RenderingCancelledException") return;
      renderedSize = "";
      console.warn("The method figure preview is being used.", error);
    }
  }

  async function loadFigure() {
    try {
      const pdfjs = await import("../vendor/pdfjs/pdf.min.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("../vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
      const pdfDocument = await pdfjs.getDocument({ url: figure.href, isEvalSupported: false }).promise;
      page = await pdfDocument.getPage(1);
      await renderFigure();
      const observer = new ResizeObserver(renderFigure);
      observer.observe(figure);
    } catch (error) {
      console.warn("The method figure preview is being used.", error);
    }
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      loadFigure();
    }, { rootMargin: "300px" });
    observer.observe(figure);
  } else {
    loadFigure();
  }
}
