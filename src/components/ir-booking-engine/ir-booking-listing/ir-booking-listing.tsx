import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'ir-booking-listing',
  styleUrl: 'ir-booking-listing.css',
  shadow: true,
})
export class IrBookingListing {
  render() {
    return (
      <Host>
        <div class={'p-4'}>
          <div class="table-container shadow-md">
            <table class="table">
              <thead>
                <tr class="table-header">
                  <th class="table-head">ID</th>
                  <th class="table-head">Name</th>
                  <th class="table-head">Email</th>
                  <th class="table-head">City</th>
                  <th class="table-head">Country</th>
                  <th class="table-head">Zip Code</th>
                </tr>
              </thead>
              <tbody class={'table-body'}>
                {[...new Array(10)].map((_, i) => (
                  <tr class="table-row">
                    <td class="table-cell">{i}</td>
                    <td class="table-cell">Name {i}</td>
                    <td class="table-cell">email{i}@example.com</td>
                    <td class="table-cell">City {i}</td>
                    <td class="table-cell">Country {i}</td>
                    <td class="table-cell">Zip{i}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div class="flex items-center justify-between px-[20px] py-[16px] ">
              <ir-button variants="outline" label="Previous" haveLeftIcon>
                <ir-icons name="arrow_left" slot="left-icon" svgClassName="size-3"></ir-icons>
              </ir-button>
              <ir-button variants="outline" label="Next" haveRightIcon>
                <ir-icons name="arrow_right" slot="right-icon" svgClassName="size-3"></ir-icons>
              </ir-button>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
