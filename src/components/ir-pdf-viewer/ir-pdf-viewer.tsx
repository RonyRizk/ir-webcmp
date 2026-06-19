import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import { getDocument, GlobalWorkerOptions, RenderingCancelledException } from 'pdfjs-dist/build/pdf.mjs';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist/types/src/pdf';

const RENDER_QUALITY = 2;
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs';

let workerInitialized = false;

function ensureWorker(workerSrc?: string) {
  if (workerInitialized) return;
  GlobalWorkerOptions.workerSrc = workerSrc ?? PDF_WORKER_URL;
  workerInitialized = true;
}

@Component({
  tag: 'ir-pdf-viewer',
  styleUrl: 'ir-pdf-viewer.css',
  shadow: true,
})
export class IrPdfViewer {
  private canvasEl?: HTMLCanvasElement;
  private loadingTask: PDFDocumentLoadingTask | null = null;
  private pdf: PDFDocumentProxy | null = null;
  private renderTask: RenderTask | null = null;
  private loadToken = 0;
  private resizeObserver?: ResizeObserver;
  private resizeTimer?: number;

  @Element() el: HTMLElement;

  @State() private currentPage = 1;
  @State() private error: string | null = null;
  @State() private isLoading = false;
  @State() private totalPages = 0;

  /** URL of the PDF to display */
  @Prop() src: string;

  @Watch('src')
  onSrcChange(next: string) {
    this.currentPage = 1;
    this.loadPdf(next);
  }

  /** Override the pdf.js worker URL (defaults to the bundled asset). Read once at first load. */
  @Prop() workerSrc?: string;

  componentWillLoad() {
    ensureWorker(this.workerSrc);
    if (this.src) this.isLoading = true;
  }

  componentDidLoad() {
    this.resizeObserver = new ResizeObserver(() => this.scheduleReRender());
    this.resizeObserver.observe(this.el);
    if (this.src) this.loadPdf(this.src);
  }

  disconnectedCallback() {
    this.loadToken++;
    this.renderTask?.cancel();
    this.renderTask = null;
    this.pdf = null;
    this.loadingTask?.destroy();
    this.loadingTask = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = undefined;
    }
  }

  private async loadPdf(url: string) {
    const token = ++this.loadToken;
    this.isLoading = true;
    this.error = null;
    this.totalPages = 0;

    try {
      if (this.loadingTask) {
        await this.loadingTask.destroy();
        this.loadingTask = null;
        this.pdf = null;
      }

      const task = getDocument({ url });
      this.loadingTask = task;
      const pdf = await task.promise;
      if (token !== this.loadToken) {
        await task.destroy();
        return;
      }

      this.pdf = pdf;
      this.totalPages = pdf.numPages;
      await this.renderPage(this.currentPage, token);
    } catch (err: unknown) {
      if (token !== this.loadToken || isCancelled(err)) return;
      const msg = err instanceof Error ? err.message : String(err);
      this.error = `Could not load PDF: ${msg}`;
    } finally {
      if (token === this.loadToken) this.isLoading = false;
    }
  }

  private async renderPage(pageNumber: number, token: number) {
    const pdf = this.pdf;
    const canvas = this.canvasEl;
    if (!pdf || !canvas) return;

    this.renderTask?.cancel();
    this.renderTask = null;

    const page = await pdf.getPage(pageNumber);
    if (token !== this.loadToken) return;

    const hostW = this.el.clientWidth;
    if (hostW === 0) return;

    const pixelRatio = (window.devicePixelRatio ?? 1) * RENDER_QUALITY;
    const naturalViewport = page.getViewport({ scale: 1 });
    const fitScale = hostW / naturalViewport.width;
    const viewport = page.getViewport({ scale: fitScale * pixelRatio });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.renderTask = page.render({ canvas, canvasContext: ctx, viewport });
    try {
      await this.renderTask.promise;
    } catch (err: unknown) {
      if (isCancelled(err)) return;
      throw err;
    } finally {
      this.renderTask = null;
    }
  }

  private scheduleReRender() {
    if (!this.pdf) return;
    if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.resizeTimer = undefined;
      this.renderPage(this.currentPage, this.loadToken);
    }, 120);
  }

  private async goTo(page: number) {
    if (!this.pdf || page < 1 || page > this.totalPages || this.isLoading) return;
    const token = this.loadToken;
    this.currentPage = page;
    this.isLoading = true;
    try {
      await this.renderPage(page, token);
    } catch (err: unknown) {
      if (token !== this.loadToken || isCancelled(err)) return;
      const msg = err instanceof Error ? err.message : String(err);
      this.error = `Could not render page: ${msg}`;
    } finally {
      if (token === this.loadToken) this.isLoading = false;
    }
  }

  private goToPrev = () => this.goTo(this.currentPage - 1);
  private goToNext = () => this.goTo(this.currentPage + 1);
  private setCanvasRef = (el?: HTMLCanvasElement) => {
    this.canvasEl = el;
  };

  render() {
    const { isLoading, error, totalPages, currentPage } = this;
    const atFirstPage = currentPage <= 1 || isLoading;
    const atLastPage = currentPage >= totalPages || isLoading;

    return (
      <Host>
        <canvas ref={this.setCanvasRef} class={{ hidden: !!error }}></canvas>

        {isLoading && (
          <div class="overlay">
            <wa-spinner></wa-spinner>
          </div>
        )}

        {error && !isLoading && (
          <div class="error-state" role="alert">
            <wa-icon name="triangle-exclamation"></wa-icon>
            <span>{error}</span>
          </div>
        )}

        {totalPages > 1 && (
          <div class="pagination">
            <button type="button" class="page-btn" aria-label="Previous page" disabled={atFirstPage} onClick={this.goToPrev}>
              <wa-icon name="chevron-left"></wa-icon>
            </button>
            <span class="page-label" aria-live="polite">
              {currentPage} / {totalPages}
            </span>
            <button type="button" class="page-btn" aria-label="Next page" disabled={atLastPage} onClick={this.goToNext}>
              <wa-icon name="chevron-right"></wa-icon>
            </button>
          </div>
        )}
      </Host>
    );
  }
}

function isCancelled(err: unknown): boolean {
  return err instanceof RenderingCancelledException;
}
