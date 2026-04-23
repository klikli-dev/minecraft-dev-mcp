export function getJsonArgumentError(rawArg: string): string {
  if (/^\{[\w.-]+:[^"'{}\s][^{}]*\}$/.test(rawArg)) {
    return 'Invalid JSON arguments. PowerShell may have stripped the quotes from your JSON. Use --version/--className/--mapping flags, or pass JSON with PowerShell stop-parsing (--%) / escaped quotes.';
  }

  return 'Invalid JSON arguments. Ensure the JSON is properly formatted. In PowerShell, native commands may strip quotes; use --version/--className/--mapping flags, or pass JSON with --% / escaped quotes.';
}
