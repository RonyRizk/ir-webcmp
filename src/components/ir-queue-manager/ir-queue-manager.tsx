import Token from '@/models/Token';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import axios from 'axios';

@Component({
  tag: 'ir-queue-manager',
  styleUrl: 'ir-queue-manager.css',
  scoped: true,
})
export class IrQueueManager {
  @Element() el: HTMLElement;

  @Prop() ticket: string = '';

  @State() isLoading: boolean = true;

  private tokenService = new Token();
  @State() data: {
    pendingRequests: number[];
    properties: string[];
    q_name: string;
    total_pending: number;
  }[];
  componentWillLoad() {
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }
  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue && newValue) {
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }

  private async init() {
    await this.fetchData();
    this.isLoading = false;
  }
  private async fetchData() {
    const { data } = await axios.post('/Get_Q_Summary', {});
    if (data.ExceptionMsg) {
      return;
    }
    this.data = data.My_Result.map(r => {
      const { pendingRequests, properties } = this.formatResults(r.properties);
      return {
        pendingRequests,
        properties,
        q_name: r.q_name,
        total_pending: r.total_pending,
      };
    });
  }
  private formatResults(data: string): {
    properties: string[];
    pendingRequests: number[];
  } {
    if (!data) {
      return { properties: [], pendingRequests: [] };
    }

    const parsed = data
      .split(',')
      .map(item => {
        const [property, pending] = item.split('|').map(v => v.trim());
        const pendingNumber = Number(pending);

        if (!property || Number.isNaN(pendingNumber)) {
          return null;
        }

        return {
          property,
          pending: pendingNumber,
        };
      })
      .filter((v): v is { property: string; pending: number } => v !== null);

    // 🔽 Sort by pending requests (highest first)
    parsed.sort((a, b) => b.pending - a.pending);

    return {
      properties: parsed.map(p => p.property),
      pendingRequests: parsed.map(p => p.pending),
    };
  }
  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    return (
      <Host>
        <ir-interceptor></ir-interceptor>
        <ir-toast></ir-toast>
        <div class="ir-page__container">
          <div class="queue-page__header">
            <h3 class="page-title">Pending Queues</h3>
            <ir-custom-button
              onClickHandler={() => {
                this.fetchData();
              }}
              appearance="filled"
              loading={isRequestPending('/Get_Q_Summary')}
            >
              <wa-icon name="refresh"></wa-icon>
            </ir-custom-button>
          </div>

          {this.data.length === 0 && <ir-empty-state style={{ marginTop: '20vh' }}></ir-empty-state>}

          <div class="queue-grid">
            {this.data.map(d => (
              <wa-card>
                <p slot="header">
                  {d.q_name} ({d.total_pending} total pending)
                </p>

                {d.properties.map((property, index) => {
                  const pending = d.pendingRequests[index];
                  const percentage = d.total_pending > 0 ? (pending / d.total_pending) * 100 : 0;

                  return (
                    <div class="queue-item">
                      <span class="queue-item__property">{property}</span>

                      <div class="queue-item__status">
                        <wa-progress-bar class="queue-item__progress" value={percentage}></wa-progress-bar>

                        <span class="queue-item__count">
                          {pending} ({percentage.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </wa-card>
            ))}
          </div>
        </div>
      </Host>
    );
  }
}
