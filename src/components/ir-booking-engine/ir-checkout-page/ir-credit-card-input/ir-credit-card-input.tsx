import { Component, Host, h, Event, EventEmitter, State } from '@stencil/core';

@Component({
  tag: 'ir-credit-card-input',
  styleUrl: 'ir-credit-card-input.css',
  shadow: true,
})
export class IrCreditCardInput {
  @State() cardType: '' | 'AMEX' | 'VISA' | 'Mastercard' = '';

  @Event() creditCardChange: EventEmitter<string>;

  private value: string[] = [];

  private handleInput = (event: KeyboardEvent, index: number, inputs: NodeListOf<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/\D/g, '');
    input.value = value;
    if (index === 0) {
      this.detectCardType(value);
    }
    if (event.key !== 'Backspace') {
      if (value.length >= input.maxLength && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    } else {
      if (value.length === 0 && index > 0) {
        inputs[index - 1].focus();
      }
    }
  };

  private detectCardType(value: string) {
    if (value.startsWith('4')) {
      this.cardType = 'VISA';
    } else if (value.startsWith('5') || value.startsWith('2')) {
      this.cardType = 'Mastercard';
    } else if (value.startsWith('34') || value.startsWith('37')) {
      this.cardType = 'AMEX';
    } else {
      this.cardType = '';
    }
  }

  getMaxLength(index: number) {
    return this.cardType === 'AMEX' && index === 3 ? 3 : 4;
  }
  render() {
    return (
      <Host>
        <div class="flex max-w-xs flex-col overflow-hidden rounded-md border p-2 md:p-4">
          <label htmlFor="first_input">Card number</label>
          <div class="flex items-center justify-between gap-4">
            {[...Array(this.cardType === 'AMEX' ? 4 : 4)].map((_, index) => (
              <input
                id={index === 0 ? 'first_input' : 'credit_card' + index}
                type="text"
                class="w-full appearance-none border-b outline-none"
                maxLength={this.getMaxLength(index)}
                onKeyDown={event => this.handleInput(event, index, (event.currentTarget as HTMLInputElement).parentElement!.querySelectorAll('input'))}
                onInput={event => {
                  const input = event.target as HTMLInputElement;
                  input.value = input.value.replace(/\D/g, '');
                  this.value[index] = input.value;
                  this.creditCardChange.emit(this.value.join(''));
                  if (input.value.length >= input.maxLength && index < 3) {
                    ((event.currentTarget as HTMLInputElement).parentElement!.querySelectorAll('input')[index + 1] as HTMLInputElement).focus();
                  }
                }}
              />
            ))}
          </div>
        </div>
      </Host>
    );
  }
}
