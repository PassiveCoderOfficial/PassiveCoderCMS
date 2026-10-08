-- Booking contact requirement: by default a customer must give an email OR a
-- phone/WhatsApp number (either one); site admins can require both.
alter table booking_settings
  add column if not exists contact_requirement text not null default 'either'
  check (contact_requirement in ('either', 'both'));

-- Email is no longer always required, but every appointment still needs a way
-- to reach the customer.
alter table booking_appointments alter column customer_email drop not null;
alter table booking_appointments drop constraint if exists booking_appointments_contact_check;
alter table booking_appointments add constraint booking_appointments_contact_check
  check (coalesce(nullif(trim(customer_email), ''), nullif(trim(customer_phone), '')) is not null);
