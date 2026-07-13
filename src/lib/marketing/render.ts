/**
 * Tiny mustache-style personalization for campaign bodies.
 * Supported: {{first_name}} {{last_name}} {{name}} {{email}} — unknown tags
 * render as empty string so a typo never leaks braces to customers.
 */
export function renderTemplate(
  body: string,
  contact: { first_name?: string | null; last_name?: string | null; email?: string | null },
): string {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  const vars: Record<string, string> = {
    first_name: contact.first_name ?? "",
    last_name: contact.last_name ?? "",
    name: name || "there",
    email: contact.email ?? "",
  };
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}
