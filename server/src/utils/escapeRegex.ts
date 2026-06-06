/** Escape user input before use in MongoDB $regex to prevent ReDoS / injection */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
