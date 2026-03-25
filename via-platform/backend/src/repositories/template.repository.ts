import { db } from '../config/database';
import type { AgentTemplate } from '../types';

function rowToTemplate(row: Record<string, unknown>): AgentTemplate {
  return {
    id:           row.id as string,
    name:         row.name as string,
    slug:         row.slug as string,
    category:     row.category as AgentTemplate['category'],
    description:  row.description as string,
    systemPrompt: row.system_prompt as string,
    firstMessage: row.first_message as string,
    language:     row.language as string,
    llmModel:     row.llm_model as string,
    previewTags:  row.preview_tags as string[],
    iconEmoji:    row.icon_emoji as string,
    isFeatured:   row.is_featured as boolean,
    createdAt:    (row.created_at as Date).toISOString(),
  };
}

export const templateRepository = {
  async findAll(category?: string): Promise<AgentTemplate[]> {
    const query = category
      ? `SELECT * FROM templates WHERE category = $1 ORDER BY is_featured DESC, name ASC`
      : `SELECT * FROM templates ORDER BY is_featured DESC, name ASC`;
    const { rows } = await db.query(query, category ? [category] : []);
    return rows.map(rowToTemplate);
  },

  async findById(id: string): Promise<AgentTemplate | null> {
    const { rows } = await db.query(`SELECT * FROM templates WHERE id = $1`, [id]);
    return rows.length ? rowToTemplate(rows[0]) : null;
  },
};
