/** GET /api/dashboard/modules */
export interface ModulesResponse {
  modules: { key: string; enabled: boolean }[];
}

/** GET /api/tenant/current */
export interface CurrentTenantResponse {
  tenantId: string | null;
}
