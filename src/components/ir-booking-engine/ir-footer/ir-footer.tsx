import BeLogoFooter from '@/assets/be_logo_footer';
import IntegrationIcons from '@/assets/integration_icons';
import app_store from '@/stores/app.store';
import { Component, h } from '@stencil/core';

@Component({
  tag: 'ir-footer',
  styleUrl: 'ir-footer.css',
  shadow: true,
})
export class IrFooter {
  render() {
    return (
      <footer class="flex items-center  border-t px-4 py-2 lg:px-6">
        <ul class="mx-auto flex w-full max-w-6xl flex-col items-center  justify-between space-y-2 md:flex-row md:space-y-0">
          <li class="flex w-full justify-between md:w-fit md:flex-col">
            <p class="font-medium">{app_store.property?.name}</p>
            <div class="flex items-center gap-2 text-sm md:gap-4">
              <a href={`tel:${app_store.property?.phone}`}>{app_store.property?.phone}</a>
              <ir-privacy-policy></ir-privacy-policy>
            </div>
          </li>
          <li class="flex items-center gap-4">
            {app_store.property?.social_media.map(media => {
              if (media.link === '') {
                return null;
              }
              const href = media.code === '006' ? `https://api.whatsapp.com/send/?phone=${media.link}` : media.link;
              return (
                <a target="_blank" href={href} title={media?.name}>
                  {IntegrationIcons[media.code]}
                </a>
              );
            })}
          </li>
          <li class="">
            <a href="https://info.igloorooms.com/" target="_blank" title="igloorooms cloud booking solutions for hotels">
              <BeLogoFooter width={120} height={60} />
              {/* <img src={'/assets/BE_logo_footer.png'} alt="igloorooms web booking engine" class="size-10 w-32 object-contain" /> */}
            </a>
          </li>
        </ul>
      </footer>
    );
  }
}
