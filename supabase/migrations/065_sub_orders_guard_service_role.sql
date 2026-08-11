-- Fix: the sub_orders guard blocked legitimate service-role writes.
--
-- auth.uid() is null for the service role and for direct postgres
-- connections, so is_super_admin()/is_tenant_member() both returned false and
-- the trigger rejected the very writes checkout and payout runs depend on.
-- Those callers are authorised in application code; the guard's actual job is
-- to stop a signed-in vendor rewriting their own order financials.

create or replace function public.sub_orders_vendor_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null
     or public.is_super_admin()
     or public.is_tenant_member(new.tenant_id) then
    new.updated_at := now();
    return new;
  end if;

  if public.owns_vendor(new.vendor_id) then
    if new.subtotal          is distinct from old.subtotal
    or new.shipping_cost     is distinct from old.shipping_cost
    or new.discount          is distinct from old.discount
    or new.total             is distinct from old.total
    or new.commission_rate   is distinct from old.commission_rate
    or new.commission_amount is distinct from old.commission_amount
    or new.vendor_earning    is distinct from old.vendor_earning
    or new.cod_amount        is distinct from old.cod_amount
    or new.cod_collected     is distinct from old.cod_collected
    or new.payout_id         is distinct from old.payout_id
    or new.items             is distinct from old.items
    or new.vendor_id         is distinct from old.vendor_id
    or new.order_id          is distinct from old.order_id
    then
      raise exception 'Vendors cannot modify order financials';
    end if;
    new.updated_at := now();
    return new;
  end if;

  raise exception 'Not authorised';
end;
$$;
