import { Component, Element, Host, Prop, Watch, h } from '@stencil/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
@Component({
  tag: 'ir-queue-chart',
  styleUrl: 'ir-queue-chart.css',
  shadow: false,
})
export class IrQueueChart {
  @Element() el: HTMLElement;

  /** Labels for X-axis */
  @Prop() labels: string[] = [];

  /** Values for bars */
  @Prop() values: number[] = [];

  /** Chart title */
  @Prop() label: string = 'Queue Status';

  private chart?: Chart;
  canvas: HTMLCanvasElement;

  componentDidLoad() {
    this.createChart();
  }

  @Watch('values')
  @Watch('labels')
  protected dataChanged() {
    this.updateChart();
  }

  disconnectedCallback() {
    this.chart?.destroy();
  }
  private getCssVar(name: string): string {
    return getComputedStyle(this.el).getPropertyValue(name).trim();
  }
  private createChart() {
    const brandColor = this.getCssVar('--wa-color-brand-fill-loud');
    const borderColor = this.getCssVar('--wa-color-surface-border');
    const textColor = this.getCssVar('--wa-color-text-normal');
    const tooltipTextColor = this.getCssVar('--wa-color-surface-default');

    this.chart = new Chart(this.canvas, {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.label,
            data: this.values,
            borderRadius: 8,
            barThickness: 32,
            backgroundColor: brandColor,
            hoverBackgroundColor: brandColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
            // modern dashboards usually hide legend
          },

          tooltip: {
            backgroundColor: textColor,
            titleColor: tooltipTextColor,
            bodyColor: tooltipTextColor,
            cornerRadius: 8,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              // color: borderColor,
            },
            ticks: {
              color: textColor,
              font: {
                size: 12,
                weight: 500,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: borderColor,
              // drawBorder: false,
            },
            ticks: {
              color: textColor,
              font: {
                size: 12,
              },
            },
          },
        },
      },
    });
  }
  private updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.labels;
    this.chart.data.datasets[0].data = this.values;
    this.chart.update();
  }

  render() {
    return (
      <Host>
        <div class="chart-container">
          <canvas ref={el => (this.canvas = el)}></canvas>
        </div>
      </Host>
    );
  }
}
