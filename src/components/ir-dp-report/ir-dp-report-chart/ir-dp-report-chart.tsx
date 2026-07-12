import { Component, Element, Host, h } from '@stencil/core';
import { Chart, registerables, type ChartDataset, type Plugin, type TooltipModel } from 'chart.js';
import moment from 'moment';
import dp_report, { onDpReportChange } from '@/stores/dp_report.store';
import { DpReportRow } from '../types';
import { formatAmount } from '@/utils/utils';

Chart.register(...registerables);

type ProfitBarDataset = ChartDataset<'bar', number[]>;

@Component({
  tag: 'ir-dp-report-chart',
  styleUrl: 'ir-dp-report-chart.css',
  shadow: false,
})
export class IrDpReportChart {
  @Element() el: HTMLElement;

  private chart?: Chart<'bar', number[]>;
  private canvas?: HTMLCanvasElement;
  private tooltipEl?: HTMLDivElement;
  private disposeRows: () => void;
  private disposeLoading: () => void;
  private rows: DpReportRow[] = [];

  componentDidLoad() {
    this.disposeRows = onDpReportChange('rows', () => this.refreshChart());
    this.disposeLoading = onDpReportChange('isLoading', () => this.refreshChart());
  }

  disconnectedCallback() {
    this.chart?.destroy();
    this.tooltipEl?.remove();
    this.tooltipEl = undefined;
    this.disposeRows?.();
    this.disposeLoading?.();
  }

  private handleCanvasRef = (el: HTMLCanvasElement | undefined) => {
    if (!el) {
      this.chart?.destroy();
      this.chart = undefined;
      this.canvas = undefined;
      this.tooltipEl?.remove();
      this.tooltipEl = undefined;
      return;
    }
    this.canvas = el;
    if (!this.chart) {
      this.createChart();
    }
  };

  private getCssVar(name: string): string {
    return getComputedStyle(this.el).getPropertyValue(name).trim();
  }

  private getSortedRows(): DpReportRow[] {
    return [...dp_report.rows].sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
  }

  private formatDateLabel(date: string): string {
    const m = moment(date, 'YYYY-MM-DD', true);
    return m.isValid() ? m.format('MMM DD') : date;
  }

  private buildDataset(rows: DpReportRow[]): ProfitBarDataset {
    const successColor = this.getCssVar('--wa-color-success-fill-loud');
    const dangerColor = this.getCssVar('--wa-color-danger-fill-loud');
    const colors = rows.map(r => (r.profit >= 0 ? successColor : dangerColor));

    return {
      label: 'Gain / Reduction',
      data: rows.map(r => r.profit),
      backgroundColor: colors,
      hoverBackgroundColor: colors,
      borderRadius: 3,
      barPercentage: 0.7,
      minBarLength: 10,
    };
  }

  private buildActiveBarHighlightPlugin(): Plugin<'bar'> {
    return {
      id: 'dpActiveBarHighlight',
      beforeDatasetsDraw: chart => {
        const active = chart.getActiveElements();
        if (!active.length) {
          return;
        }
        const { index } = active[0];
        const { ctx, chartArea, scales } = chart;
        const bandWidth = chartArea.width / this.rows.length;
        const centerX = scales.x.getPixelForValue(index);
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = this.getCssVar('--wa-color-neutral-fill-quiet') || 'rgba(148, 163, 184, 0.15)';
        ctx.fillRect(centerX - bandWidth / 2, chartArea.top, bandWidth, chartArea.height);
        ctx.restore();
      },
    };
  }

  private renderTooltipContent(container: HTMLDivElement, row: DpReportRow) {
    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'dp-chart-tooltip__header';

    if (row.raw.origin?.Icon) {
      const logo = document.createElement('img');
      logo.className = 'dp-chart-tooltip__logo';
      logo.src = row.raw.origin.Icon;
      logo.alt = row.raw.origin.Label ?? '';
      header.appendChild(logo);
    }

    const source = document.createElement('span');
    source.className = 'dp-chart-tooltip__source';
    source.textContent = row.raw.origin?.Label ?? 'Unknown source';
    header.appendChild(source);

    const date = document.createElement('div');
    date.className = 'dp-chart-tooltip__date';
    date.textContent = moment(row.date).format('MMM DD, YYYY');

    // const tone = row.profit >= 0 ? 'Gain' : 'Reduction';
    const sign = row.profit >= 0 ? '+' : '-';

    const effectRow = document.createElement('div');
    effectRow.className = 'dp-chart-tooltip__row';
    effectRow.append(`Dynamic pricing effect: `);
    const effectValue = document.createElement('span');
    effectValue.className = `dp-chart-tooltip__value dp-chart-tooltip__value--${row.profit >= 0 ? 'gain' : 'loss'}`;
    effectValue.textContent = `${sign}${formatAmount(row.currencySymbol, Math.abs(row.profit))}`;
    effectRow.appendChild(effectValue);

    const valueRow = document.createElement('div');
    valueRow.className = 'dp-chart-tooltip__row';
    valueRow.textContent = `Total accommodation value: ${formatAmount(row.currencySymbol, row.accommodationGross)}`;

    container.append(header, date, effectRow, valueRow);
  }

  private handleTooltip = (context: { chart: Chart; tooltip: TooltipModel<'bar'> }) => {
    const { chart, tooltip } = context;

    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'dp-chart-tooltip';
      chart.canvas.parentNode?.appendChild(this.tooltipEl);
    }

    if (tooltip.opacity === 0) {
      this.tooltipEl.style.opacity = '0';
      return;
    }

    const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
    const row = dataIndex === undefined ? undefined : this.rows[dataIndex];
    if (!row) {
      this.tooltipEl.style.opacity = '0';
      return;
    }

    this.renderTooltipContent(this.tooltipEl, row);
    this.tooltipEl.style.opacity = '1';

    const idealCenterX = chart.canvas.offsetLeft + tooltip.caretX;
    const tooltipWidth = this.tooltipEl.offsetWidth;
    const minLeft = chart.canvas.offsetLeft;
    const maxLeft = chart.canvas.offsetLeft + chart.canvas.offsetWidth - tooltipWidth;
    const left = Math.min(Math.max(idealCenterX - tooltipWidth / 2, minLeft), maxLeft);
    const arrowLeft = Math.min(Math.max(idealCenterX - left, 12), tooltipWidth - 12);

    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${chart.canvas.offsetTop + tooltip.caretY}px`;
    this.tooltipEl.style.setProperty('--dp-tooltip-arrow-left', `${arrowLeft}px`);
  };

  private createChart() {
    if (!this.canvas) {
      return;
    }
    this.rows = this.getSortedRows();
    const borderColor = this.getCssVar('--wa-color-surface-border');
    const textColor = this.getCssVar('--wa-color-text-normal');
    this.chart = new Chart(this.canvas, {
      type: 'bar',
      data: {
        labels: this.rows.map(r => this.formatDateLabel(r.date)),
        datasets: [this.buildDataset(this.rows)],
      },
      plugins: [this.buildActiveBarHighlightPlugin()],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: this.handleTooltip,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              autoSkip: false,
              maxRotation: 0,
              callback: (_value, index) => {
                const row = this.rows[index];
                if (!row) {
                  return '';
                }
                const isFirstOfDate = index === 0 || this.rows[index - 1].date !== row.date;
                return isFirstOfDate ? this.formatDateLabel(row.date) : '';
              },
            },
          },
          y: {
            grid: { color: borderColor },
            ticks: { color: textColor },
          },
        },
      },
    });
  }

  private refreshChart() {
    if (!this.chart) {
      return;
    }

    this.rows = this.getSortedRows();
    const dataset = this.buildDataset(this.rows);
    this.chart.data.labels = this.rows.map(r => this.formatDateLabel(r.date));
    this.chart.data.datasets[0].data = dataset.data;
    this.chart.data.datasets[0].backgroundColor = dataset.backgroundColor;
    this.chart.data.datasets[0].hoverBackgroundColor = dataset.hoverBackgroundColor;
    this.chart.update();
  }

  render() {
    if (dp_report.isLoading) {
      return (
        <Host>
          <div class="dp-chart__loading">
            <ir-spinner></ir-spinner>
          </div>
        </Host>
      );
    }
    if (dp_report.rows.length === 0) {
      return (
        <Host>
          <div class="dp-chart-container dp-chart-container--empty">
            <ir-empty-state message="No dynamic pricing data for this date range."></ir-empty-state>
          </div>
        </Host>
      );
    }
    return (
      <Host>
        <div class="dp-chart-container">
          <canvas ref={this.handleCanvasRef}></canvas>
        </div>
      </Host>
    );
  }
}
