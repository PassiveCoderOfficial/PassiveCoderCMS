// Site ownership transfer — POST /api/tenant/transfer-ownership. Body shape
// and response shape both confirmed by reading src/app/api/tenant/transfer-ownership/route.ts
// and src/lib/tenant/transfer-ownership.ts directly.
//
// IMPORTANT: no generated password is ever returned in the response — the
// route's TransferResult type is { ok: true; userId; created; passwordSet }
// (see transfer-ownership.ts). passwordSet only reports WHETHER a password
// was set (by the caller-supplied `password` field), never what it was. If
// the caller wants the client to receive credentials, they must supply the
// password themselves in the request — the backend never generates one.

import { apiFetch } from "../api";

export interface TransferOwnershipInput {
  tenantId: string;
  email: string;
  password?: string;
  fullName?: string;
  requirePasswordChange?: boolean;
  resetExistingPassword?: boolean;
  previousOwner?: "demote" | "remove";
}

export interface TransferOwnershipResult {
  ok: boolean;
  created?: boolean;
  passwordSet?: boolean;
  userId?: string;
  error?: string;
}

export async function transferOwnership(input: TransferOwnershipInput): Promise<TransferOwnershipResult> {
  const r = await apiFetch<{ ok?: boolean; created?: boolean; passwordSet?: boolean; userId?: string; error?: string }>(
    "/api/tenant/transfer-ownership",
    { method: "POST", body: input }
  );
  if (!r.ok) return { ok: false, error: r.data?.error ?? "Failed to transfer ownership" };
  return { ok: true, created: r.data.created, passwordSet: r.data.passwordSet, userId: r.data.userId };
}
