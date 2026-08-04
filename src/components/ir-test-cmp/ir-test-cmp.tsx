import { Component, Element, State, h } from '@stencil/core';
import { Toast } from '../ir-toast-provider/ir-toast-provider';
import { showToast } from '@/utils/utils';

@Component({
  tag: 'ir-test-cmp',
  styleUrl: 'ir-test-cmp.css',
  scoped: true,
})
export class IrTestCmp {
  @Element() el: HTMLElement;

  private ela?: HTMLIrOtpModalElement;

  @State() open = false;
  @State() openDialog = false;

  private toast(toast: Toast) {
    showToast(toast);
  }

  private renderToastOptions() {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <wa-button
          style={{
            minWidth: '110px',
            flex: '1',
          }}
          onClick={() =>
            this.toast({
              title: 'Heads up',
              description: 'This is an info message.',
              type: 'info',
            })
          }
        >
          Info
        </wa-button>

        <wa-button
          variant="success"
          style={{
            minWidth: '110px',
            flex: '1',
          }}
          onClick={() =>
            this.toast({
              title: 'Saved',
              description: 'Operation completed successfully!',
              type: 'success',
            })
          }
        >
          Success
        </wa-button>

        <wa-button
          variant="danger"
          style={{
            minWidth: '110px',
            flex: '1',
          }}
          onClick={() =>
            this.toast({
              title: 'Failed',
              description: 'Something went wrong. Please try again.',
              type: 'error',
            })
          }
        >
          Danger
        </wa-button>

        <wa-button
          variant="warning"
          style={{
            minWidth: '110px',
            flex: '1',
          }}
          onClick={() =>
            this.toast({
              title: 'Careful',
              description: 'Proceed with caution.',
              type: 'warning',
            })
          }
        >
          Warning
        </wa-button>

        <wa-button
          variant="brand"
          style={{
            minWidth: '120px',
            flex: '1',
          }}
          onClick={() =>
            this.toast({
              title: 'Item archived',
              actionLabel: 'Undo',
              type: 'info',
            })
          }
        >
          With action
        </wa-button>

        <wa-button
          style={{
            minWidth: '120px',
            flex: '1',
          }}
          onClick={() =>
            this.toast({
              title: 'Persistent',
              description: 'Stays until closed.',
              type: 'info',
              duration: 0,
            })
          }
        >
          Persistent
        </wa-button>
      </div>
    );
  }

  render() {
    return (
      <ir-page label="Component Playground" description="Test drawers, dialogs, OTP modals, and toast notifications.">
        <wa-card appearance="plain" style={{ background: 'var(--wa-color-surface-default)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <wa-button
              style={{
                minWidth: '120px',
              }}
              onClick={() => (this.open = true)}
            >
              Open drawer
            </wa-button>

            <wa-button
              style={{
                minWidth: '120px',
              }}
              onClick={() => (this.openDialog = true)}
            >
              Open dialog
            </wa-button>

            <wa-button
              style={{
                minWidth: '120px',
              }}
              onClick={() => this.ela?.openModal()}
            >
              Open OTP
            </wa-button>
          </div>
          <wa-divider></wa-divider>
          {this.renderToastOptions()}
        </wa-card>

        <ir-drawer
          label="Toast examples"
          open={this.open}
          style={{
            color: '#1f2937',
          }}
          onDrawerHide={() => (this.open = false)}
        >
          {this.renderToastOptions()}
        </ir-drawer>

        <ir-dialog label="Notification center" open={this.openDialog} onIrDialogAfterHide={() => (this.openDialog = false)}>
          {this.renderToastOptions()}
        </ir-dialog>

        <ir-otp-modal
          ref={element => (this.ela = element)}
          style={{
            position: 'relative',
            zIndex: '1000',
          }}
        ></ir-otp-modal>
      </ir-page>
    );
  }
}
