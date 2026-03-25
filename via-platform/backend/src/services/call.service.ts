import { callRepository } from '../repositories/call.repository';
import { agentRepository } from '../repositories/agent.repository';
import { twilioService } from './twilio.service';
import { env } from '../config/env';
import type { Call, EndCallDto } from '../types';

export const callService = {
  async startOutbound(userId: string, agentId: string, toNumber: string): Promise<Call> {
    const agent = await agentRepository.findById(agentId, userId);
    if (!agent) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });

    const fromNumber = env.TWILIO_FROM_NUMBER ?? '';
    const call = await callRepository.create(
      userId,
      { agentId, direction: 'outbound', fromNumber, toNumber },
      agent.name
    );

    // Fire-and-forget: trigger Twilio call asynchronously
    (async () => {
      try {
        const twiml = twilioService.buildElevenLabsTwiml(agentId, fromNumber);
        const sid   = await twilioService.createOutboundCall(toNumber, fromNumber, twiml);
        await callRepository.updateExternalId(call.id, 'twilio_call_sid', sid);
      } catch {
        await callRepository.end(call.id, userId, { status: 'failed' });
      }
    })();

    return call;
  },

  async endCall(callId: string, userId: string, dto: EndCallDto): Promise<Call | null> {
    return callRepository.end(callId, userId, dto);
  },

  async getActive(userId: string): Promise<Call[]> {
    return callRepository.findActive(userId);
  },

  async getHistory(userId: string, limit?: number): Promise<Call[]> {
    return callRepository.findHistory(userId, limit);
  },

  async getById(callId: string, userId: string): Promise<Call | null> {
    return callRepository.findById(callId, userId);
  },
};
