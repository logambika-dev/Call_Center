import { env } from '../config/env';

export const twilioService = {
  async createOutboundCall(to: string, from: string, twiml: string): Promise<string> {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    const credentials = Buffer.from(
      `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization:  `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Twiml: twiml }).toString(),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `Twilio error: ${res.status}`);
    }

    const data = await res.json() as { sid: string };
    return data.sid;
  },

  buildElevenLabsTwiml(agentId: string, callerNumber: string): string {
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${agentId}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="agent_id" value="${agentId}"/>
      <Parameter name="caller_number" value="${callerNumber}"/>
    </Stream>
  </Connect>
</Response>`;
  },
};
