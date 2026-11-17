/** Open edition: no marketplace online-payment expiry. */
export async function expireUnpaidOnlineOrders(..._args: unknown[]): Promise<{ cancelled: number }> {
  return { cancelled: 0 };
}
