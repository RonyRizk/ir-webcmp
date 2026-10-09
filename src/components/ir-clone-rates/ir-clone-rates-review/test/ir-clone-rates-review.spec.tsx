import { newSpecPage } from '@stencil/core/testing';
import { h } from '@stencil/core';
import { IrCloneRatesReview } from '../ir-clone-rates-review';

describe('ir-clone-rates-review', () => {
  const rows = [
    { label: 'Copy rates from', value: 'Jan 1, 2025 – Dec 31, 2025' },
    { label: 'Rate changes', value: '+ 5%' },
  ];

  it('renders each summary row', async () => {
    const page = await newSpecPage({
      components: [IrCloneRatesReview],
      template: () => <ir-clone-rates-review rows={rows}></ir-clone-rates-review>,
    });
    const items = Array.from(page.root.querySelectorAll('.clone-rates-review__row')).map(row => row.textContent);
    expect(items).toEqual(['Copy rates from:Jan 1, 2025 – Dec 31, 2025', 'Rate changes:+ 5%']);
  });

  it('emits goBack and confirmClone from the footer buttons', async () => {
    const page = await newSpecPage({
      components: [IrCloneRatesReview],
      template: () => <ir-clone-rates-review rows={rows}></ir-clone-rates-review>,
    });
    const goBack = jest.fn();
    const confirm = jest.fn();
    page.root.addEventListener('goBack', goBack);
    page.root.addEventListener('confirmClone', confirm);

    const [back, confirmBtn] = Array.from(page.root.querySelectorAll('ir-custom-button'));
    back.dispatchEvent(new CustomEvent('clickHandler'));
    confirmBtn.dispatchEvent(new CustomEvent('clickHandler'));

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
