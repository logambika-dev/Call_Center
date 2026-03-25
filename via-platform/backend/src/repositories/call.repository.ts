import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import type { Call, CreateCallDto, EndCallDto } from '../types';

function rowToCall(row: Record<string, unknown>): Call {
  return {
    id:               row.id as string,
    userId:           row.user_id as string,
    agentId:          row.agent_id as string,
    agentName:        row.agent_name as string,
    direction:        row.direction as Call['direction'],
    status:           row.status as Call['status'],
    fromNumber:       row.from_number as string,
    toNumber:         row.to_number as string,
    durationSecs:     row.duration_secs != null ? Number(row.duration_secs) : null,
    elevenLabsCallId: row.elevenlabs_call_id as string | null,
    twilioCallSid:    row.twilio_call_sid as string | null,
    costCredits:      row.cost_credits != null ? Number(row.cost_credits) : null,
    llmCostUsd:       row.llm_cost_usd  != null ? Number(row.llm_cost_usd)  : null,
    recordingUrl:     row.recording_url as string | null,
    transcript:       row.transcript as string | null,
    metadata:         (row.metadata as Record<string, unknown>) ?? {},
    startedAt:        (row.started_at as Date).toISOString(),
    endedAt:          row.ended_at ? (row.ended_at as Date).toISOString() : null,
    createdAt:        (row.created_at as Date).toISOString(),
  };
}

export const callRepository = {
  async create(userId: string, dto: CreateCallDto, agentName: string): Promise<Call> {
    const { rows } = await db.query(
      `INSERT INTO calls (id, user_id, agent_id, agent_name, direction, from_number, to_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [uuid(), userId, dto.agentId, agentName, dto.direction, dto.fromNumber, dto.toNumber]
    );
    return rowToCall(rows[0]);
  },

  async end(callId: string, userId: string, dto: EndCallDto): Promise<Call | null> {
    const sets: string[] = ['status = $1', 'ended_at = NOW()'];
    const vals: unknown[] = [dto.status ?? 'ended'];
    let i = 3;

    if (dto.durationSecs != null) { sets.push(`duration_secs = $${i++}`);  vals.push(dto.durationSecs); }
    if (dto.costCredits  != null) { sets.push(`cost_credits = $${i++}`);   vals.push(dto.costCredits); }
    if (dto.llmCostUsd   != null) { sets.push(`llm_cost_usd = $${i++}`);   vals.push(dto.llmCostUsd); }
    if (dto.recordingUrl != null) { sets.push(`recording_url = $${i++}`);  vals.push(dto.recordingUrl); }
    if (dto.transcript   != null) { sets.push(`transcript = $${i++}`);     vals.push(dto.transcript); }

    vals.push(callId, userId);
    const { rows } = await db.query(
      `UPDATE calls SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
      vals
    );
    return rows.length ? rowToCall(rows[0]) : null;
  },

  async updateExternalId(callId: string, field: 'elevenlabs_call_id' | 'twilio_call_sid', value: string): Promise<void> {
    await db.query(`UPDATE calls SET ${field} = $1 WHERE id = $2`, [value, callId]);
  },

  async findActive(userId: string): Promise<Call[]> {
    const { rows } = await db.query(
      `SELECT * FROM calls WHERE user_id = $1 AND status IN ('ringing','connected')
       ORDER BY started_at DESC`,
      [userId]
    );
    return rows.map(rowToCall);
  },

  async findHistory(userId: string, limit = 50): Promise<Call[]> {
    const { rows } = await db.query(
      `SELECT * FROM calls WHERE user_id = $1 AND status IN ('ended','failed')
       ORDER BY started_at DESC LIMIT $2`,
      [userId, limit]
    );
    return rows.map(rowToCall);
  },

  async findById(callId: string, userId: string): Promise<Call | null> {
    const { rows } = await db.query(
      `SELECT * FROM calls WHERE id = $1 AND user_id = $2`, [callId, userId]
    );
    return rows.length ? rowToCall(rows[0]) : null;
  },
};
