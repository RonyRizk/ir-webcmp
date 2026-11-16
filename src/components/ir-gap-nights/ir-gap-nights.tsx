import { SetupEntries } from '@/models/IBooking';
import ApiClient from '@/models/ApiClient';
import { SetupService, groupEntryTablesResult, getSetupEntryLabel } from '@/services/setup';
import { PropertyService } from '@/services/property.service';
import { RoomService } from '@/services/room.service';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { showToast } from '@/utils/utils';
import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';

type GapRule = {
  gap_lookahead_days: number;
  type: {
    code: string;
    description: string;
  };
};

const DEFAULT_RULE_CODE = '000';
const DEFAULT_LOOKAHEAD_DAYS = 30;

@Component({
  tag: 'ir-gap-nights',
  styleUrl: 'ir-gap-nights.css',
  scoped: true,
})
export class IrGapNights {
  @Prop() ticket: string;
  @Prop() p: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;

  @State() isLoading: boolean;
  @State() isSaving: boolean;
  @State() selectedRule: string = DEFAULT_RULE_CODE;
  @State() applicableDays: number = DEFAULT_LOOKAHEAD_DAYS;
  @State() gapRules: SetupEntries[] = [];
  @State() gapRanges: SetupEntries[] = [];

  private propertyId: number;
  private apiClientService = new ApiClient();
  private roomService = new RoomService();
  private propertyService = new PropertyService();
  private setupService = new SetupService();

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.gapNights, () => this.init());

  componentWillLoad() {
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
      this.init();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.apiClientService.setApiClient(newValue);
      this.init();
    }
  }

  @Watch('p')
  handlePChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue && this.ticket) this.init();
  }

  @Watch('propertyid')
  handlePropertyIdChange(newValue: number, oldValue: number) {
    if (newValue !== oldValue && this.ticket) this.init();
  }

  private async init() {
    try {
      this.isLoading = true;
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.gapNights });
      const [propertyRes, , setupEntries] = await Promise.all([
        this.roomService.getExposedProperty({
          id: this.propertyid ?? 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
        }),
        localeReady,
        this.setupService.getSetupEntriesByTableNameMulti(['_GAP_RANGE', '_GAP_RULE']),
      ]);

      this.propertyId = propertyRes.My_Result.id;

      const { gap_rule, gap_range } = groupEntryTablesResult(setupEntries);
      this.gapRules = gap_rule ?? [];
      this.gapRanges = gap_range ?? [];

      const gapRule: GapRule | undefined = propertyRes.My_Result?.gap_rule;
      if (gapRule) {
        this.selectedRule = gapRule.type?.code ?? gap_rule[0].CODE_NAME;
        this.applicableDays = gapRule.gap_lookahead_days ?? Number(gap_range[0].CODE_NAME);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  private async save() {
    try {
      this.isSaving = true;
      await this.propertyService.setPropertyGapConfig({
        property_id: this.propertyId,
        gap_rule_code: this.selectedRule,
        gap_lookahead_days: this.selectedRule === DEFAULT_RULE_CODE ? 0 : this.applicableDays,
      });
      showToast({ position: 'top-right', title: t('Lcz_SavedSuccessfully', { fallback: 'Saved successfully' }), description: '', type: 'success' });
    } catch (err) {
      console.error(err);
      showToast({ position: 'top-right', title: t('Lcz_FailedToSave', { fallback: 'Failed to save' }), description: String(err), type: 'error' });
    } finally {
      this.isSaving = false;
    }
  }

  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    const ruleDisabled = isRequestPending('/Set_Property_Gap_Config') || this.isSaving;
    const periodDisabled = ruleDisabled || this.selectedRule === DEFAULT_RULE_CODE;

    return (
      <Host>
        <ir-page label={t('Lcz_GapNights', { fallback: 'Gap Nights' })}>
          <ir-custom-button slot="page-header" variant="brand" loading={ruleDisabled} onClickHandler={() => this.save()}>
            {t('Lcz_Save', { fallback: 'Save' })}
          </ir-custom-button>
          <wa-card appearance="plain" class="gap-nights__card">
            <wa-callout variant="neutral" size="s">
              <wa-icon slot="icon" name="circle-info"></wa-icon>
              {t('Lcz_GapNightsExplanation', {
                fallback:
                  "Gap nights are nights guests can't book because of your length of stay restriction. For example, if you have 2 consecutive nights left and you've set a restriction of 3 nights minimum stay, guests won't be able to book those 2 nights.",
              })}
            </wa-callout>

            <wa-radio-group
              label={t('Lcz_Rule', { fallback: 'Rule' })}
              value={this.selectedRule}
              defaultValue={this.selectedRule}
              onchange={(e: CustomEvent) => {
                this.selectedRule = (e.target as HTMLInputElement).value;
              }}
            >
              {this.gapRules.map(r => (
                <wa-radio key={r.CODE_NAME} value={r.CODE_NAME} disabled={ruleDisabled}>
                  {getSetupEntryLabel(r)}
                </wa-radio>
              ))}
            </wa-radio-group>

            <wa-select
              size="s"
              class="gap-nights__day-options"
              label={t('Lcz_ApplicableOverTheNext', { fallback: 'Applicable over the next' })}
              value={this.applicableDays.toString()}
              defaultValue={this.applicableDays.toString()}
              disabled={periodDisabled}
              onchange={(e: CustomEvent) => {
                this.applicableDays = Number((e.target as HTMLSelectElement).value);
              }}
            >
              {this.gapRanges.map(r => (
                <wa-option key={r.CODE_NAME} value={Number(r.CODE_NAME).toString()}>
                  {getSetupEntryLabel(r)}
                </wa-option>
              ))}
            </wa-select>
          </wa-card>
        </ir-page>
      </Host>
    );
  }
}
