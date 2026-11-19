/** A returned week's reason is saved as one text: "<reason> — <comments>"
 * (see RejectDrawer). This splits it back into its two parts for display.
 * Older texts without the " — " separator come back as reason only. */
export function splitReturnReason(text: string | null | undefined): { reason: string; comments: string } {
  if (!text) return { reason: '', comments: '' };
  const separator = ' — ';
  const index = text.indexOf(separator);
  if (index === -1) return { reason: text.trim(), comments: '' };
  return {
    reason: text.slice(0, index).trim(),
    comments: text.slice(index + separator.length).trim(),
  };
}
