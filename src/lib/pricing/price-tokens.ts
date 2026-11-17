/**
 * Open edition: Passive Coder's price book is hosted only. Price tokens in
 * page content are left as written.
 */
export async function withPriceTokens<T>(value: T): Promise<T> {
  return value;
}
