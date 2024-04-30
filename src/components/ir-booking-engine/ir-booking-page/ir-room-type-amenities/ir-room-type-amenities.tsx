import { Component, Prop, h } from '@stencil/core';
import { Amenity, RoomType } from '@/models/property';
@Component({
  tag: 'ir-room-type-amenities',
  styleUrl: 'ir-room-type-amenities.css',
  shadow: true,
})
export class IrRoomTypeAmenities {
  @Prop() aminities: Amenity[];
  @Prop() roomType: RoomType;
  render() {
    return (
      <div class="space-y-3">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class=" flex items-center gap-4">
            <div class="flex items-center gap-2">
              <ir-icons name="dimensions"></ir-icons>
              <p>
                {this.roomType.size}{' '}
                <span class="ordinal">
                  m<sup>2</sup>
                </span>
              </p>
            </div>{' '}
            <div class="flex items-center gap-2">
              <ir-icons name="wifi"></ir-icons>
              <p>{this.aminities?.some(amenity => amenity.amenity_type === 'room' && amenity.code === 'freewifi') ? 'wifi' : ''} </p>
              {/* <p>Free Wifi</p> */}
            </div>
          </div>

          <div class="flex items-center gap-4">
            {/* <div class="flex items-center gap-2">
              <ir-icons name="user_group"></ir-icons>
              <p>Sleeps {this.roomType.occupancy_max.adult_nbr}</p>
            </div> */}
            <div class="flex items-center gap-2">
              <ir-icons name="bed"></ir-icons>
              {this.roomType?.bedding_setup?.map((bed_setup, index) => (
                <p key={bed_setup.code}>
                  {bed_setup.name} {index < this.roomType.bedding_setup.length - 1 && <span> - </span>}
                </p>
              ))}
            </div>
          </div>
        </div>
        <p innerHTML={this.roomType?.description} class="py-4"></p>
        <h3 class="text-lg font-medium text-gray-800">Amenities</h3>
        <ul class="grid grid-cols-2 gap-4 text-xs sm:text-sm lg:grid-cols-3 ">
          {this.aminities.map(aminity => {
            if (aminity.amenity_type !== 'room') {
              return null;
            }
            return (
              <li class="ml-4 list-disc" key={aminity.code}>
                {aminity.description}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
