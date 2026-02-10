import { AgentsTypes } from '@/components/ir-agents/types';
import { z } from 'zod';

export const ExposedAgentsPropsSchema = z.object({
  property_id: z.coerce.number(),
});
export type ExposedAgentsProps = z.infer<typeof ExposedAgentsPropsSchema>;

export const CodeDescriptionSchema = z.object({
  code: z.string(),
  description: z.string().nullable().optional(),
});

export type CodeDescription = z.infer<typeof CodeDescriptionSchema>;

export const AgentRateTypeCodeSchema = CodeDescriptionSchema;
export type AgentRateTypeCode = z.infer<typeof AgentRateTypeCodeSchema>;

export const AgentTypeCodeSchema = CodeDescriptionSchema;
export type AgentTypeCode = z.infer<typeof AgentTypeCodeSchema>;

export const PaymentModeSchema = CodeDescriptionSchema;
export type PaymentMode = z.infer<typeof PaymentModeSchema>;

export const AgentBaseSchema = z.object({
  address: z.string(),
  agent_rate_type_code: AgentRateTypeCodeSchema,
  agent_type_code: AgentTypeCodeSchema.required(),
  city: z.string(),
  code: z.string().trim().min(5).max(10).or(z.literal('')).nullable(),
  contact_name: z.string(),
  contract_nbr: z.any(),
  country_id: z.coerce.number().nullable(),
  currency_id: z.any(),
  due_balance: z.any(),
  email: z.string().email().nonempty(),
  email_copied_upon_booking: z.string().email().nullable(),
  id: z.number().default(-1),
  is_active: z.boolean(),
  is_send_guest_confirmation_email: z.boolean(),
  name: z.string().nonempty(),
  notes: z.string(),
  payment_mode: PaymentModeSchema,
  phone: z.string(),
  property_id: z.any(),
  provided_discount: z.any().default(null),
  question: z.string().nullable(),
  sort_order: z.any(),
  tax_nbr: z.string(),
  reference: z.string().nullable().optional(),
  verification_mode: z.string().nullable().default(null),
});

export const AgentSchema = AgentBaseSchema.superRefine((value, ctx) => {
  const trimmedCode = (value.code ?? '').trim();
  const trimmedQuestion = (value.question ?? '').trim();
  if (value.agent_type_code?.code === AgentsTypes.TOUR_OPERATOR) {
    if (value.verification_mode?.trim() !== '' && value.verification_mode !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Verification mode must be empty when agent_type_code is ${AgentsTypes.TOUR_OPERATOR}.`,
        path: ['verification_mode'],
      });
    }

    if (trimmedCode !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Code must be empty when agent_type_code is ${AgentsTypes.TOUR_OPERATOR}.`,
        path: ['code'],
      });
    }

    if (trimmedQuestion !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Question must be empty when agent_type_code is ${AgentsTypes.TOUR_OPERATOR}.`,
        path: ['question'],
      });
    }
  }

  if (value.verification_mode === 'code' && trimmedCode.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Code is required when verification_mode is code.',
      path: ['code'],
    });
  }

  if (value.verification_mode === 'question' && value.question?.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Question is required when verification_mode is question.',
      path: ['question'],
    });
  }

  const contractMissing = value.contract_nbr === null || value.contract_nbr === undefined || (typeof value.contract_nbr === 'string' && value.contract_nbr.trim() === '');

  if (value.agent_rate_type_code?.code === '004' && contractMissing) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Contract number is required when agent_rate_type_code is 004.',
      path: ['contract_nbr'],
    });
  }
});
export type Agent = z.infer<typeof AgentSchema>;

export const AgentsSchema = z.array(AgentSchema).nullable();
export type Agents = z.infer<typeof AgentsSchema>;

export const HandleExposedAgentPropsSchema = z.object({
  agent: AgentSchema,
});
export type HandleExposedAgentProps = z.infer<typeof HandleExposedAgentPropsSchema>;
