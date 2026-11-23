import axios from 'axios';
import {
  Agent,
  Agents,
  ExposedAgentProps,
  ExposedAgentPropsSchema,
  ExposedAgentsProps,
  ExposedAgentsPropsSchema,
  HandleExposedAgentProps,
  HandleExposedAgentPropsSchema,
} from './type';

export class AgentsService {
  public async getExposedAgents(props: ExposedAgentsProps): Promise<Agents> {
    const payload = ExposedAgentsPropsSchema.parse(props);
    const { data } = await axios.post('/Get_Exposed_Agents', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
  public async getExposedAgent(props: ExposedAgentProps): Promise<Agent> {
    const payload = ExposedAgentPropsSchema.parse(props);
    const { data } = await axios.post('/Get_Exposed_Agent', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
  /**
   * Creates or updates an agent.
   * Pass `skipValidation` for partial updates of an already-persisted agent (e.g. toggling `is_active`
   * from the table), where the stored record may not satisfy the editor form's schema.
   */
  public async handleExposedAgent(props: HandleExposedAgentProps, { skipValidation = false }: { skipValidation?: boolean } = {}) {
    const payload = skipValidation ? props : HandleExposedAgentPropsSchema.parse(props);
    const { data } = await axios.post('/Handle_Exposed_Agent', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
}
