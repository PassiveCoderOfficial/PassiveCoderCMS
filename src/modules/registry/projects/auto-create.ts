/** Open edition: no Projects module, so imports do not create a project. */
export async function autoCreateRootProject(..._args: unknown[]): Promise<null> {
  return null;
}
