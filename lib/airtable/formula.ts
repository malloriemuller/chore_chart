/** Escapes a value for safe interpolation into an Airtable `filterByFormula` string literal. */
export function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
