import { SetupEntries } from '@/models/IBooking';

export type AgentSetupEntries = { agent_rate_type: SetupEntries[]; agent_type: SetupEntries[]; ta_payment_method: SetupEntries[]; cl_post_timing: SetupEntries[] };

export const AgentsTypes = {
  TRAVEL_AGENT: '001',
  CORPORATE_CLIENT: '002',
  TOUR_OPERATOR: '003',
  AFFILIATE: '004',
} as const;
