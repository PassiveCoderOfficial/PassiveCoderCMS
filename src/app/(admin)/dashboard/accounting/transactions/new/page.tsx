import { TransactionForm } from "../transaction-form";

export default function NewTransactionPage() {
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add Transaction</h1>
      <TransactionForm />
    </div>
  );
}
