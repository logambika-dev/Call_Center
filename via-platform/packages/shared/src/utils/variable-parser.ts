const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/**
 * Extract all unique {{variable}} keys from a prompt string.
 * Returns an array of variable key names (without the braces).
 */
export function extractVariables(prompt: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(VARIABLE_REGEX.source, 'g');
  while ((match = re.exec(prompt)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

/**
 * Replace all {{variable}} placeholders with provided values.
 * Missing keys are left as-is.
 */
export function interpolateVariables(
  prompt: string,
  values: Record<string, string>,
): string {
  return prompt.replace(VARIABLE_REGEX, (_, key) => values[key] ?? `{{${key}}}`);
}

/**
 * Validate that a prompt string contains only well-formed variables.
 * Returns an array of malformed tokens, or empty array if all good.
 */
export function findMalformedVariables(prompt: string): string[] {
  const malformed: string[] = [];
  // Catch unclosed {{ or {{{ patterns
  const bad = prompt.match(/\{+[^}]*$|\{[^{][^}]*\}|\{\{[^a-zA-Z_][^}]*\}\}/g);
  if (bad) malformed.push(...bad);
  return malformed;
}
