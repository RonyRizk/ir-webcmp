import { RoomType } from '@/models/property';
import app_store from '@/stores/app.store';
import { Component, Fragment, h, Listen, Prop } from '@stencil/core';
import { v4 } from 'uuid';

@Component({
  tag: 'ir-property-gallery',
  styleUrl: 'ir-property-gallery.css',
  shadow: true,
})
export class IrPropertyGallery {
  @Prop() property_state: 'carousel' | 'gallery' = 'gallery';
  @Prop() roomType: RoomType;
  private irDialog: HTMLIrDialogElement;

  @Listen('openGallery')
  handleOpenGallery() {
    this.irDialog.openModal();
  }
  @Listen('carouselImageClicked')
  handleOpenCarouselGallery() {
    this.irDialog.openModal();
  }
  showPlanLimitations(withRoomSize: boolean = true) {
    if (!this.roomType) {
      return null;
    }
    const maxNumber = this.roomType?.occupancy_max?.adult_nbr + this.roomType?.occupancy_max?.children_nbr;
    if (maxNumber > 7) {
      return (
        <div class="pointer-events-none absolute -bottom-1 z-40 flex w-full items-center justify-between bg-white/80 px-2 py-1 pb-2 text-sm ">
          <div class="flex items-center gap-1">
            <p>Maximum</p>
            <div class="ml-1 flex items-end">
              <div class="flex items-center">
                <ir-icons svgClassName="size-3" name="user"></ir-icons>
                <p>{this.roomType.occupancy_max.adult_nbr}</p>
              </div>
              {this.roomType.occupancy_max.children_nbr > 0 && (
                <div class="flex items-center">
                  <ir-icons svgClassName="size-3" name="child"></ir-icons>
                  <p>{this.roomType.occupancy_max.children_nbr}</p>
                </div>
              )}
            </div>
          </div>
          {withRoomSize && (
            <p>
              {this.roomType.size}
              <span class="ordinal">
                m<sup>2</sup>
              </span>
            </p>
          )}
        </div>
      );
    }
    return (
      <div class="pointer-events-none absolute -bottom-1 z-40 flex w-full items-center justify-between bg-white/80 px-2 py-1 pb-2 text-sm ">
        <div class="flex items-center">
          <p>Maximum</p>
          <div class="ml-1 flex items-center">
            {[...new Array(this.roomType.occupancy_max.adult_nbr)].map((_, i) => (
              <ir-icons svgClassName="size-3" key={i} name="user"></ir-icons>
            ))}
          </div>
        </div>
        {withRoomSize && (
          <p>
            {this.roomType.size}
            <span class="ordinal">
              m<sup>2</sup>
            </span>
          </p>
        )}
      </div>
    );
  }

  render() {
    const images = this.property_state === 'carousel' ? this.roomType.images : app_store.property?.images;
    return (
      <div>
        {this.property_state === 'gallery' ? (
          <ir-gallery totalImages={app_store.property?.images.length} images={app_store.property?.images?.map(i => i.url).slice(0, 5)}></ir-gallery>
        ) : (
          <Fragment>
            <div class="flex flex-wrap items-center gap-2 py-2 text-sm font-normal text-gray-700 md:hidden">
              <ir-accomodations
                bookingAttributes={{
                  max_occupancy: this.roomType.occupancy_max.adult_nbr,
                  bedding_setup: this.roomType.bedding_setup,
                }}
                amenities={app_store.property?.amenities}
              ></ir-accomodations>
            </div>
            <div class="carousel-container relative h-48 w-full rounded-md   md:hidden">
              {this.roomType.images.length === 1 ? (
                <img
                  onClick={() => this.irDialog.openModal()}
                  class="h-full w-full cursor-pointer rounded-[var(--radius,8px)] object-cover "
                  src={this.roomType.images[0].url}
                  alt={this.roomType.images[0].tooltip}
                />
              ) : (
                <ir-carousel
                  slides={this.roomType?.images?.map(img => ({
                    alt: img.tooltip,
                    id: v4(),
                    image_uri: img.url,
                  }))}
                ></ir-carousel>
              )}
              {this.showPlanLimitations()}
            </div>
            <div class="hidden py-2 md:block">
              <div class="carousel-container relative mb-1 w-full rounded-md md:max-h-[200px] md:w-auto xl:max-h-[250px] ">
                {this.roomType.images?.length === 1 ? (
                  <Fragment>
                    <img
                      onClick={() => this.irDialog.openModal()}
                      src={this.roomType.images[0].url}
                      alt={this.roomType.images[0].tooltip}
                      class="h-full w-full cursor-pointer rounded-[var(--radius,8px)] object-cover "
                    />
                    {this.showPlanLimitations()}
                  </Fragment>
                ) : (
                  <Fragment>
                    <ir-carousel
                      slides={this.roomType.images?.map(img => ({
                        alt: img.tooltip,
                        id: v4(),
                        image_uri: img.url,
                      }))}
                    ></ir-carousel>
                    {this.showPlanLimitations()}
                  </Fragment>
                )}
                {/* <div class="lg:hidden">
                  <ir-accomodations
                    bookingAttributes={{
                      max_occupancy: this.roomType.occupancy_max.adult_nbr,
                      bedding_setup: this.roomType.bedding_setup,
                    }}
                    amenities={this.exposed_property.amenities}
                  ></ir-accomodations>
                </div> */}
              </div>
              <ir-button onButtonClick={() => this.irDialog.openModal()} variants="link" label="More details" buttonStyles={{ paddingLeft: '0' }}></ir-button>
            </div>
          </Fragment>
        )}
        <ir-dialog ref={el => (this.irDialog = el)}>
          <div slot="modal-body" class="modal-container max-h-[80vh] overflow-y-auto px-4 pb-4  pt-0 md:p-4 md:pt-0">
            <div class=" sticky top-0 z-50 mb-2 flex w-full  items-center justify-between bg-white py-2 md:pt-4">
              <h2 class="text-lg font-semibold md:text-xl">{this.property_state === 'carousel' ? this.roomType.name : app_store.property?.name}</h2>
              <ir-button variants="icon" onButtonClick={() => this.irDialog.closeModal()}>
                <div slot="btn-icon">
                  <ir-icons name="xmark"></ir-icons>
                </div>
              </ir-button>
            </div>
            <section class="max-h-[80vh]">
              <div class="coursel_gallery_container">
                <ir-carousel
                  slides={images?.map(img => ({
                    alt: img.tooltip,
                    id: v4(),
                    image_uri: img.url,
                  }))}
                  onCarouselImageClicked={e => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                  }}
                ></ir-carousel>
                {this.showPlanLimitations(false)}
              </div>
              {this.property_state === 'carousel' && (
                <section class={'z-0 py-4 text-sm'}>
                  <ir-room-type-amenities aminities={app_store.property?.amenities} roomType={this.roomType}></ir-room-type-amenities>
                </section>
              )}
            </section>
          </div>
        </ir-dialog>
      </div>
    );
  }
}
