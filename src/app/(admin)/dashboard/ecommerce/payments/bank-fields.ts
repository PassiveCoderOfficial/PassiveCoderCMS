/** Bank-transfer fields a store fills in (client copy of lib/ecommerce/payment-methods BANK_FIELDS). */
export const BANK_FIELDS_CLIENT: { key: string; label: string; multiline?: boolean }[] = [
  { key: "bank_name", label: "Bank name" },
  { key: "account_title", label: "Account title" },
  { key: "account_number", label: "Account number" },
  { key: "iban", label: "IBAN" },
  { key: "swift", label: "SWIFT / BIC" },
  { key: "branch", label: "Branch" },
  { key: "instructions", label: "Instructions for the customer", multiline: true },
];
