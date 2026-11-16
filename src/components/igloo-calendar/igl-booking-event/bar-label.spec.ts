import { visibleLabelSpan } from './bar-label';

// All values are physical px in the bars' container. `view` is the part of the grid the user can
// actually see: the scroll viewport minus the sticky room-name column. Labels keep 5px from the
// bar's own ends.
describe('visibleLabelSpan', () => {
  const view = { viewStart: 300, viewEnd: 1000 };
  const short = { labelWidth: 100 };

  it('leaves a fully visible bar alone (its label is already centred in it)', () => {
    expect(visibleLabelSpan({ barLeft: 400, barWidth: 200, ...view, ...short })).toBeNull();
  });

  it('leaves a bar that is entirely out of view alone', () => {
    expect(visibleLabelSpan({ barLeft: 0, barWidth: 100, ...view, ...short })).toBeNull();
    expect(visibleLabelSpan({ barLeft: 1200, barWidth: 100, ...view, ...short })).toBeNull();
  });

  it('centres the label in the visible part of a bar scrolled past its start', () => {
    // Visible 300..700 → centre 500, i.e. 400px into a bar starting at 100.
    expect(visibleLabelSpan({ barLeft: 100, barWidth: 600, ...view, ...short })).toEqual({ center: 400 });
  });

  it('centres the label in the visible part of a bar running off the end of the view', () => {
    // Visible 800..1000 → centre 900, 100px into the bar.
    expect(visibleLabelSpan({ barLeft: 800, barWidth: 700, ...view, ...short })).toEqual({ center: 100 });
  });

  it('centres the label in the view itself for a long stay overflowing both edges', () => {
    // A 50-night bar: visible 300..1000 → centre 650, 650px into a bar starting at 0.
    expect(visibleLabelSpan({ barLeft: 0, barWidth: 2900, ...view, ...short })).toEqual({ center: 650 });
  });

  it('keeps a name too wide for the visible part inside the bar, against the bar’s visible end', () => {
    // Visible 800..1000 (200px) but the name is 300px: centred at 900 it would spill 50px before the
    // bar's start, so it rests 5px in from the start instead (805..1105) and the viewport cuts the rest.
    expect(visibleLabelSpan({ barLeft: 800, barWidth: 700, ...view, labelWidth: 300 })).toEqual({ center: 155 });
    // Mirror: visible 300..400 at the bar's end, 300px name → rests 5px in from the end (95..395).
    expect(visibleLabelSpan({ barLeft: 0, barWidth: 400, ...view, labelWidth: 300 })).toEqual({ center: 245 });
  });

  it('treats a name wider than the whole bar as the bar’s width, since it truncates there anyway', () => {
    // 100px bar, 300px name → label is 90px; the only place it fits is the bar's centre.
    expect(visibleLabelSpan({ barLeft: 250, barWidth: 100, ...view, labelWidth: 300 })).toEqual({ center: 50 });
  });
});
