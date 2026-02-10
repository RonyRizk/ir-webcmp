import { IEntries } from '@/models/IBooking';

export type AgentSetupEntries = { agent_rate_type: IEntries[]; agent_type: IEntries[]; ta_payment_method: IEntries[] };

export const AgentsTypes = {
  TRAVEL_AGENT: '001',
  CORPORATE_CLIENT: '002',
  TOUR_OPERATOR: '003',
  AFFILIATE: '004',
} as const;
