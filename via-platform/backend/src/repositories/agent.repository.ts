import { PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '../types';

function rowToAgent(row: Record<string, unknown>): Agent {
  return {
    id:             row.id as string,
    userId:         row.user_id as string,
    name:           row.name as string,
    slug:           row.slug as string,
    mode:           row.mode as Agent['mode'],
    status:         row.status as Agent['status'],
    systemPrompt:   row.system_prompt as string,
    firstMessage:   row.first_message as string,
    voiceId:        row.voice_id as string | null,
    language:       row.language as string,
    llmModel:       row.llm_model as Agent['llmModel'],
    llmTemperature: Number(row.llm_temperature),
    llmMaxTokens:   Number(row.llm_max_tokens),
    templateId:     row.template_id as string | null,
    metadata:       (row.metadata as Record<string, unknown>) ?? {},
    variables:      (row.variables as Agent['variables']) ?? [],
    createdAt:      (row.created_at as Date).toISOString(),
    updatedAt:      (row.updated_at as Date).toISOString(),
  };
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function uniqueSlug(userId: string, base: string, client: PoolClient): Promise<string> {
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? toSlug(base) : `${toSlug(base)}-${suffix}`;
    const { rows } = await client.query(
      `SELECT 1 FROM agents WHERE user_id = $1 AND slug = $2`, [userId, candidate]
    );
    if (!rows.length) return candidate;
    suffix++;
  }
}

const WITH_VARIABLES = `
  SELECT a.*,
    COALESCE(json_agg(v ORDER BY v.variable_key) FILTER (WHERE v.id IS NOT NULL), '[]') AS variables
  FROM agents a
  LEFT JOIN agent_variables v ON v.agent_id = a.id`;

export const agentRepository = {
  async findAllByUser(userId: string): Promise<Agent[]> {
    const { rows } = await db.query(
      `${WITH_VARIABLES}
       WHERE a.user_id = $1 AND a.status <> 'archived'
       GROUP BY a.id ORDER BY a.updated_at DESC`,
      [userId]
    );
    return rows.map(rowToAgent);
  },

  async findById(agentId: string, userId: string): Promise<Agent | null> {
    const { rows } = await db.query(
      `${WITH_VARIABLES}
       WHERE a.id = $1 AND a.user_id = $2
       GROUP BY a.id`,
      [agentId, userId]
    );
    return rows.length ? rowToAgent(rows[0]) : null;
  },

  async create(userId: string, dto: CreateAgentDto, variables: string[]): Promise<Agent> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const slug    = await uniqueSlug(userId, dto.name, client);
      const agentId = uuid();

      const { rows } = await client.query(
        `INSERT INTO agents
           (id, user_id, name, slug, mode, system_prompt, first_message,
            voice_id, language, llm_model, llm_temperature, llm_max_tokens, template_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          agentId, userId, dto.name, slug, dto.mode,
          dto.systemPrompt ?? '', dto.firstMessage ?? '',
          dto.voiceId ?? null, dto.language ?? 'en',
          dto.llmModel ?? 'claude-3-5-sonnet-20241022',
          dto.llmTemperature ?? 0.7, dto.llmMaxTokens ?? 1024,
          dto.templateId ?? null,
        ]
      );

      if (variables.length) await this._upsertVariables(agentId, variables, client);
      await client.query('COMMIT');

      const agent = rowToAgent(rows[0]);
      agent.variables = await this._fetchVariables(agentId);
      return agent;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(agentId: string, userId: string, dto: UpdateAgentDto, variables?: string[]): Promise<Agent | null> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const fieldMap: Record<string, string> = {
        name: 'name', status: 'status', systemPrompt: 'system_prompt',
        firstMessage: 'first_message', voiceId: 'voice_id', language: 'language',
        llmModel: 'llm_model', llmTemperature: 'llm_temperature', llmMaxTokens: 'llm_max_tokens',
      };

      const sets: string[] = [];
      const vals: unknown[] = [];
      let i = 1;

      for (const [key, col] of Object.entries(fieldMap)) {
        if (key in dto && (dto as Record<string, unknown>)[key] !== undefined) {
          sets.push(`${col} = $${i++}`);
          vals.push((dto as Record<string, unknown>)[key]);
        }
      }

      let agent: Agent | null = null;
      if (sets.length) {
        vals.push(agentId, userId);
        const { rows } = await client.query(
          `UPDATE agents SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
          vals
        );
        if (!rows.length) { await client.query('ROLLBACK'); return null; }
        agent = rowToAgent(rows[0]);
      }

      if (variables !== undefined) await this._upsertVariables(agentId, variables, client);
      await client.query('COMMIT');

      if (agent) agent.variables = await this._fetchVariables(agentId);
      return agent ?? await this.findById(agentId, userId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async archive(agentId: string, userId: string): Promise<boolean> {
    const { rowCount } = await db.query(
      `UPDATE agents SET status = 'archived' WHERE id = $1 AND user_id = $2`,
      [agentId, userId]
    );
    return (rowCount ?? 0) > 0;
  },

  async _upsertVariables(agentId: string, keys: string[], client: PoolClient): Promise<void> {
    await client.query(
      `DELETE FROM agent_variables WHERE agent_id = $1 AND variable_key <> ALL($2::text[])`,
      [agentId, keys]
    );
    for (const key of keys) {
      await client.query(
        `INSERT INTO agent_variables (agent_id, variable_key) VALUES ($1,$2)
         ON CONFLICT (agent_id, variable_key) DO NOTHING`,
        [agentId, key]
      );
    }
  },

  async _fetchVariables(agentId: string): Promise<Agent['variables']> {
    const { rows } = await db.query(
      `SELECT id, agent_id AS "agentId", variable_key AS "variableKey",
              description, default_val AS "defaultValue", created_at AS "createdAt"
       FROM agent_variables WHERE agent_id = $1 ORDER BY variable_key`,
      [agentId]
    );
    return rows;
  },
};
