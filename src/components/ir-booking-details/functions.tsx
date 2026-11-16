import { Agent } from '@/services/agents/type';
import { formatDate, formatTime } from '@/utils/date';
import { isAlpha } from '@/utils/utils';

/** Month name (3 letters), day, year — localized, and Hijri when that preference is active. */
export const _formatDate = (date: string) => formatDate(date, 'MMM DD, YYYY');

/** Day number/month number plus the weekday name. */
export const _getDay = (date: string) => formatDate(date, 'DD/MM ddd');

/**
 * Formats an hour/minute pair, honouring the platform's 12h/24h preference. Builds a real `Date`
 * rather than parsing `'9:5'` as a date string, which moment's loose parser handles unreliably.
 */
export const _formatTime = (hour: string, minute: string) => {
  const date = new Date();
  date.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0);
  return formatTime(date);
};

/**
 * Base URL of the booking printing screen (mode and other params get appended). Alpha pages
 * (`window.environment === 'alpha'`) print through the `IRPrinting_alpha` gateway app.
 */
const getPrintingHost = () => (isAlpha() ? 'test.bookingmystay.com' : 'gateway.igloorooms.com/PrintBooking');

export const getPrintingBaseUrl = (aname: string, bookingNumber: string) => {
  return `https://${getPrintingHost()}/${aname}/printing/fd?id=${bookingNumber}`;
};

/**
 * Registration card (consent document) of one room, served by the same printing app as the
 * booking print. `token` is the short-living token; it's left out when it couldn't be fetched.
 */
export const getRegistrationCardUrl = ({ aname, bookingNumber, roomIdentifier, token }: { aname: string; bookingNumber: string; roomIdentifier: string; token: string | null }) => {
  let url = `https://${getPrintingHost()}/${aname}/printing/doc?mode=consent&id=${encodeURIComponent(bookingNumber)}&room_identifier=${encodeURIComponent(roomIdentifier)}`;
  if (isAlpha()) {
    url += '&environment=alpha';
  }
  if (token) {
    url += `&token=${encodeURIComponent(token)}`;
  }
  return url;
};

export const isAgentMode = (agent: Agent) => {
  return agent && agent.payment_mode.code !== '002';
};
