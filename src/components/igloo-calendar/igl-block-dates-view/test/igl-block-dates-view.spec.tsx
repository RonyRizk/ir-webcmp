import { newSpecPage } from '@stencil/core/testing';
import type { SetupEntries } from '@/models/IBooking';

// The real service pulls in axios (ESM), which this jest setup can't parse.
jest.mock('axios', () => {
  const axios = { post: jest.fn(), interceptors: { request: { use: jest.fn() } } };
  return { __esModule: true, default: axios, ...axios };
});

import { SetupService } from '@/services/setup';
import { locales } from '@/stores/locales.store';
import { IglBlockDatesView } from '../igl-block-dates-view';

const entry = (code: string, label: string) => ({ CODE_NAME: code, CODE_VALUE_EN: label }) as SetupEntries;

async function renderView() {
  const page = await newSpecPage({
    components: [IglBlockDatesView],
    html: `<igl-block-dates-view from-date="2026-11-05" to-date="2026-11-06"></igl-block-dates-view>`,
  });
  await page.waitForChanges();
  return page;
}

const optionLabels = (root: HTMLElement) => Array.from(root.querySelectorAll('wa-option')).map(option => option.textContent.trim());

describe('igl-block-dates-view', () => {
  beforeEach(() => {
    locales.language = 'en';
    locales.entries = {
      Lcz_Reason: 'Reason',
      Lcz_AutomaticReleaseIn: 'Automatic release in %1',
      Lcz_NotAutomaticRelease: 'Not automatic release',
      Lcz_OutOfservice: 'Out of service',
    };
    jest.spyOn(SetupService.prototype, 'getBlockedInfo').mockResolvedValue([entry('0', 'Never'), entry('1', '1 hour'), entry('24', '1 day')]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    locales.entries = null;
    locales.language = null;
  });

  it('labels each release period with its automatic release sentence, and period 0 as not automatic', async () => {
    const page = await renderView();

    expect(optionLabels(page.root)).toEqual(['Not automatic release', 'Automatic release in 1 hour', 'Automatic release in 1 day']);
  });

  it('names the first radio Reason and gives the group no separate label', async () => {
    const page = await renderView();

    expect(page.root.querySelector('wa-radio[value="auto"]').textContent.trim()).toBe('Reason');
    expect(page.root.querySelector('wa-radio-group [slot="label"]')).toBeNull();
  });

  it('never exposes an unfilled placeholder on the release period icon', async () => {
    const page = await renderView();

    expect(page.root.querySelector('wa-select wa-icon').getAttribute('label') ?? '').not.toContain('%1');
  });
});
