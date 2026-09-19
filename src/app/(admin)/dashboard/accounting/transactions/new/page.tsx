import { TransactionForm } from "../transaction-form";
import { NewTransactionHeader } from "../../accounting-header";

export default function NewTransactionPage() {
  return (
    <div className="p-6 max-w-xl">
      <NewTransactionHeader />
      <TransactionForm />
    </div>
  );
}
