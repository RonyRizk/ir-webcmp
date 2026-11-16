import { getPrintingBaseUrl, getRegistrationCardUrl } from './functions';

type Env = Window & { environment?: string };

afterEach(() => {
  delete (window as Env).environment;
});

describe('getPrintingBaseUrl', () => {
  it('points at the PrintBooking gateway app by default', () => {
    expect(getPrintingBaseUrl('myhotel', '12345')).toBe('https://gateway.igloorooms.com/PrintBooking/myhotel/printing/fd?id=12345');
  });

  it('points at the PrintBooking gateway app when window.environment is not "alpha"', () => {
    (window as Env).environment = 'staging';

    expect(getPrintingBaseUrl('myhotel', '12345')).toBe('https://gateway.igloorooms.com/PrintBooking/myhotel/printing/fd?id=12345');
  });

  it('points at the IRPrinting_alpha gateway app when window.environment is "alpha"', () => {
    (window as Env).environment = 'alpha';

    expect(getPrintingBaseUrl('myhotel', '12345')).toBe('https://gateway.igloorooms.com/IRPrinting_alpha/myhotel/printing/fd?id=12345');
  });
});

describe('getRegistrationCardUrl', () => {
  it('points at the PrintBooking gateway consent document for the room', () => {
    expect(getRegistrationCardUrl({ aname: 'a35', bookingNumber: '12345', roomIdentifier: 'R-1', token: 'tok' })).toBe(
      'https://gateway.igloorooms.com/PrintBooking/a35/printing/doc?mode=consent&id=12345&room_identifier=R-1&token=tok',
    );
  });

  it('points at the alpha printing host and flags the environment when window.environment is "alpha"', () => {
    (window as Env).environment = 'alpha';

    expect(getRegistrationCardUrl({ aname: 'a35', bookingNumber: '12345', roomIdentifier: 'R-1', token: 'tok' })).toBe(
      'https://test.bookingmystay.com/a35/printing/doc?mode=consent&id=12345&room_identifier=R-1&environment=alpha&token=tok',
    );
  });

  it('url-encodes the room identifier and token', () => {
    expect(getRegistrationCardUrl({ aname: 'a35', bookingNumber: '12345', roomIdentifier: 'a&b', token: 'x/y+z' })).toBe(
      'https://gateway.igloorooms.com/PrintBooking/a35/printing/doc?mode=consent&id=12345&room_identifier=a%26b&token=x%2Fy%2Bz',
    );
  });

  it('leaves the token out when none could be fetched', () => {
    expect(getRegistrationCardUrl({ aname: 'a35', bookingNumber: '12345', roomIdentifier: 'R-1', token: null })).toBe(
      'https://gateway.igloorooms.com/PrintBooking/a35/printing/doc?mode=consent&id=12345&room_identifier=R-1',
    );
  });
});
