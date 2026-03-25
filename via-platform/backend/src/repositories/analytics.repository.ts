import { db } from '../config/database';
import type { AnalyticsSummary, AnalyticsDataPoint, AnalyticsQuery } from '../types';

function buildConditions(userId: string, query: AnalyticsQuery) {
  const conditions = [`user_id = $1`, `status IN ('ended','failed')`];
  const vals: unknown[] = [userId];
  let i = 2;

  if (query.from)    { conditions.push(`started_at >= $${i++}`); vals.push(query.from); }
  if (query.to)      { conditions.push(`started_at <= $${i++}`); vals.push(query.to); }
  if (query.agentId) { conditions.push(`agent_id = $${i++}`);    vals.push(query.agentId); }

  return { where: conditions.join(' AND '), vals };
}

export const analyticsRepository = {
  async getSummary(userId: string, query: AnalyticsQuery): Promise<AnalyticsSummary> {
    const { where, vals } = buildConditions(userId, query);
    const { rows } = await db.query(
      `SELECT
         COUNT(*)::int                         AS total_calls,
         COALESCE(AVG(duration_secs), 0)::float AS avg_duration_secs,
         COALESCE(SUM(cost_credits),  0)::float AS total_cost_credits,
         COALESCE(AVG(cost_credits),  0)::float AS avg_cost_credits,
         COALESCE(SUM(llm_cost_usd),  0)::float AS total_llm_cost_usd,
         COALESCE(AVG(llm_cost_usd),  0)::float AS avg_llm_cost_usd
       FROM calls WHERE ${where}`,
      vals
    );
    const r = rows[0];
    return {
      totalCalls:       r.total_calls,
      avgDurationSecs:  r.avg_duration_secs,
      totalCostCredits: r.total_cost_credits,
      avgCostCredits:   r.avg_cost_credits,
      totalLlmCostUsd:  r.total_llm_cost_usd,
      avgLlmCostUsd:    r.avg_llm_cost_usd,
    };
  },

  async getTimeSeries(userId: string, query: AnalyticsQuery): Promise<AnalyticsDataPoint[]> {
    const trunc = query.granularity === 'week' ? 'week' : 'day';
    const { where, vals } = buildConditions(userId, query);
    const { rows } = await db.query(
      `SELECT
         DATE_TRUNC('${trunc}', started_at)::date AS date,
         COUNT(*)::int                             AS call_count
       FROM calls WHERE ${where}
       GROUP BY 1 ORDER BY 1`,
      vals
    );
    return rows.map(r => ({
      date:      (r.date as Date).toISOString().slice(0, 10),
      callCount: r.call_count as number,
    }));
  },
};
