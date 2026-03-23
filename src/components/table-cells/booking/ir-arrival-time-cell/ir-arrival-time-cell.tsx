import { Booking } from '@/models/booking.dto';
import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-arrival-time-cell',
  styleUrl: 'ir-arrival-time-cell.css',
  shadow: true,
})
export class IrArrivalTimeCell {
  @Prop({ reflect: true }) display: 'block' | 'inline' = 'block';
  @Prop() arrival: Booking['arrival'];
  @Prop() arrivalTimeLabel: string;

  render() {
    return (
      <Host>
        <div class="arrival-time-cell__container">
          {this.arrivalTimeLabel && <span class="arrival-time-cell__label">{this.arrivalTimeLabel}: </span>}
          <p>{this.arrival?.description}</p>
        </div>
      </Host>
    );
  }
}
