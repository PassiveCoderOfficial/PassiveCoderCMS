/**
 * The limits on a site transfer by anyone but a super admin. No imports, so tests
 * can check them directly (tests/platform/site-transfer.test.ts).
 *
 * A manager gets everything in the panel except creating or deleting super admin
 * accounts, so a transfer must not become a way round that:
 *   - the root site never moves: it runs the platform itself
 *   - a super admin's password is never set through a transfer
 *   - a super admin who owns the site may lose ownership but stays on as admin.
 *     Most sites are built under a super admin's account and handed over from
 *     there, so refusing those outright would leave managers unable to hand over
 *     most sites. Removing that super admin from the team is refused.
 *
 * Staff get the same limits as a manager: handovers are their job, so they may
 * set an existing account's password (never a super admin's). Site owners get
 * one more limit: they never overwrite the password of an account that already
 * exists. All they would have to do is type someone's email into the transfer
 * form to take that account over.
 */

export type TransferRefusal = { error: string; status: number };

export type ManagerTransferCheck = {
  isRootSite: boolean;
  /** The transfer would overwrite the password of an account that already exists. */
  resetsExistingPassword: boolean;
  /** canActOnUser(manager, new owner) was false. */
  targetIsProtected: boolean;
  previousOwner: "demote" | "remove";
  /** canActOnUser(manager, current owner) was false for a current owner. */
  currentOwnerIsProtected: boolean;
};

export const ROOT_SITE_REFUSAL = "The main Passive Coder site can only be transferred by a super admin.";
export const EXISTING_PASSWORD_REFUSAL = "A transfer can't set the password of an account that already exists. Transfer without a password: they keep their current one, or can use Forgot password.";

export function managerTransferRefusal(c: ManagerTransferCheck): TransferRefusal | null {
  if (c.isRootSite) return { error: ROOT_SITE_REFUSAL, status: 403 };
  if (c.resetsExistingPassword && c.targetIsProtected) {
    return { error: "That account is a super admin. Its password can't be set through a transfer. Transfer without setting a password.", status: 403 };
  }
  if (c.previousOwner === "remove" && c.currentOwnerIsProtected) {
    return { error: "The current owner is a super admin, and only a super admin can remove their access. Keep them on as admin.", status: 403 };
  }
  return null;
}

/** Why a transfer is refused for someone who isn't a super admin (they have no limits here). */
export function transferRefusal(authority: "manager" | "member" | "staff", c: ManagerTransferCheck): TransferRefusal | null {
  if (authority === "member" && c.resetsExistingPassword) return { error: EXISTING_PASSWORD_REFUSAL, status: 403 };
  return managerTransferRefusal(c);
}

export type TransferAuditFacts = {
  siteName: string | null;
  siteSlug: string | null;
  oldOwnerId: string | null;
  toEmail: string;
  newOwnerId: string | null;
  accountCreated: boolean;
  credentialsSet: boolean;
  previousOwner: "demote" | "remove";
  actorId: string;
};

/**
 * What the admin audit row records. Field names avoid "password" on purpose:
 * redactArgs replaces any key that looks like a secret, so a flag called
 * passwordSet would be stored as "[redacted]" and say nothing. Only ever a
 * yes/no here, never the password.
 */
export function transferAuditArgs(f: TransferAuditFacts) {
  return {
    site: f.siteSlug,
    siteName: f.siteName,
    oldOwnerId: f.oldOwnerId,
    newOwnerEmail: f.toEmail,
    newOwnerId: f.newOwnerId,
    accountCreated: f.accountCreated,
    credentialsSet: f.credentialsSet,
    previousOwnerAction: f.previousOwner,
    toSelf: f.newOwnerId === f.actorId,
  };
}
