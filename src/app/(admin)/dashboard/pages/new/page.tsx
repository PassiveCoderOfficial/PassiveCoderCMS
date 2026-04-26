import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSlug, generateId } from "@/lib/utils";
import { NewPageForm } from "./new-page-form";

export default function NewPagePage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Page</h1>
      <NewPageForm />
    </div>
  );
}
