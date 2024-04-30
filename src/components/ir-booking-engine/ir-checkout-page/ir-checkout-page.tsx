import { PickupFormData } from '@/models/pickup';
import { IrUserFormData } from '@/models/user_form';
import { PropertyService } from '@/services/api/property.service';
import app_store from '@/stores/app.store';
import { checkout_store } from '@/stores/checkout.store';
import { Component, Host, Listen, State, h } from '@stencil/core';
import { ZodError, ZodIssue } from 'zod';

@Component({
  tag: 'ir-checkout-page',
  styleUrl: 'ir-checkout-page.css',
  shadow: true,
})
export class IrCheckoutPage {
  @State() isLoading = false;
  @State() error: { cause: 'user' | 'pickup'; issues: Record<string, ZodIssue> };

  private propertyService = new PropertyService();

  componentWillLoad() {
    this.propertyService.setToken(app_store.app_data.token);
  }

  @Listen('bookingClicked')
  async handleBooking(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.error = undefined;
    this.isLoading = true;
    try {
      IrUserFormData.parse(checkout_store.userFormData);
    } catch (error) {
      if (error instanceof ZodError) {
        console.log(error);
        let issues: Record<string, ZodIssue> = {};
        error.issues.map(issue => (issues[issue.path[0]] = issue));
        this.error = {
          cause: 'user',
          issues,
        };
      }
      this.isLoading = false;

      return;
    }
    console.log('first');
    try {
      if (checkout_store.pickup.location) {
        PickupFormData.parse(checkout_store.pickup);
      }
    } catch (error) {
      console.log(error);
      if (error instanceof ZodError) {
        let issues: Record<string, ZodIssue> = {};
        error.issues.map(issue => (issues[issue.path[0]] = issue));
        this.error = {
          cause: 'pickup',
          issues,
        };
      }
      this.isLoading = false;

      return;
    }
    try {
      await this.propertyService.bookUser();
    } catch (error) {
      console.log(error);
    }
    this.isLoading = false;
  }
  render() {
    return (
      <Host>
        <main class="flex w-full  flex-col justify-between gap-4 md:items-center lg:flex-row lg:items-start">
          <section class="w-full space-y-12 md:max-w-4xl">
            <ir-user-form class="" errors={this.error && this.error.cause === 'user' ? this.error.issues : undefined}></ir-user-form>
            <ir-booking-details></ir-booking-details>
            <ir-pickup errors={this.error && this.error.cause === 'pickup' ? this.error.issues : undefined}></ir-pickup>
            {/* <ir-phone-input></ir-phone-input> */}
          </section>
          <section class="w-full md:flex  lg:sticky  lg:top-20 lg:max-w-md lg:justify-end">
            <ir-booking-summary isLoading={this.isLoading}></ir-booking-summary>
          </section>
        </main>
      </Host>
    );
  }
}
