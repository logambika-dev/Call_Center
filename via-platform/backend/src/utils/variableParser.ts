export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g) ?? [];
  return [...new Set(matches.map(m => m.slice(2, -2)))];
}
