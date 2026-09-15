-- Real bug fix: support_tickets/support_ticket_messages have SELECT
-- policies only (migration 004) — no INSERT was ever added for either
-- table. The tenant dashboard's "Submit Ticket" button has been silently
-- broken by RLS since it shipped; only guest submissions (which route
-- through the admin client in /api/support/contact) and server-side
-- manual-payment tickets (also admin client) ever actually landed.
-- Confirmed live: zero real tenant-submitted tickets exist in prod.

-- A logged-in tenant member can create a ticket for their own tenant, or a
-- user with no tenant (e.g. a super admin, or someone between tenants) can
-- create one tied to just their user_id. Mirrors the read policy's same
-- two conditions exactly.
DROP POLICY IF EXISTS "tickets_insert" ON support_tickets;
CREATE POLICY "tickets_insert" ON support_tickets
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND (
      tenant_id IS NULL
      OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
    )
  );

-- Ticket replies (support_ticket_messages) were designed into the schema
-- (004) but never given an INSERT policy or any UI on either side — no one
-- could ever reply to a ticket, tenant or super admin. Real conversation
-- thread being built now (mobile+web). A tenant/ticket-owner can reply on
-- their own ticket; super admins can reply on any ticket and are the only
-- ones who may post an internal (staff-only) note.
DROP POLICY IF EXISTS "ticket_messages_insert" ON support_ticket_messages;
CREATE POLICY "ticket_messages_insert" ON support_ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND is_internal = false  -- non-super-admins can never post internal notes; overridden below for SA
    AND ticket_id IN (
      SELECT id FROM support_tickets
      WHERE user_id = auth.uid()
        OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "ticket_messages_insert_super_admin" ON support_ticket_messages;
CREATE POLICY "ticket_messages_insert_super_admin" ON support_ticket_messages
  FOR INSERT WITH CHECK (
    is_super_admin() AND user_id = auth.uid()
  );

-- A ticket must move out of "resolved"/"closed" back to "open" when its
-- owner replies, or the reply lands invisibly on a ticket support already
-- considers done. Tenants/owners can update status on their own ticket for
-- exactly this; nothing else on the row is writable by them (department/
-- priority/assignment stay super-admin-only via the existing management
-- UI, which uses the admin client and so is unaffected by this policy).
DROP POLICY IF EXISTS "tickets_update_owner_reopen" ON support_tickets;
CREATE POLICY "tickets_update_owner_reopen" ON support_tickets
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- RLS policies gate ROWS, not COLUMNS — the USING/WITH CHECK above would
-- let a ticket owner rewrite department/priority/subject/body too if they
-- crafted the request by hand, not just flip status. Super-admin writes
-- (the /api/super-admin/tickets PATCH route) use the admin client and
-- bypass RLS+triggers entirely, so this only constrains the direct-Supabase
-- owner path added above.
CREATE OR REPLACE FUNCTION support_tickets_owner_update_guard()
RETURNS trigger AS $$
BEGIN
  IF is_super_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.subject IS DISTINCT FROM OLD.subject
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.department IS DISTINCT FROM OLD.department
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.attachments IS DISTINCT FROM OLD.attachments
  THEN
    RAISE EXCEPTION 'Only status may be changed by a ticket owner';
  END IF;
  IF NEW.status NOT IN ('open', 'in_progress', 'waiting', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_support_tickets_owner_update_guard ON support_tickets;
CREATE TRIGGER trg_support_tickets_owner_update_guard
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION support_tickets_owner_update_guard();
