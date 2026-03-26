import type { Metadata } from "next";
import { getAllFormFieldsBatches, getFormFields } from "@/lib/actions/form-builder";
import FormBuilderClient from "./FormBuilderClient";

export const metadata: Metadata = {
  title: "지원 양식 관리 | SPEC Admin",
};

export default async function AdminFormBuilderPage() {
  const batchesResult = await getAllFormFieldsBatches();
  const batches = batchesResult.data ?? [];
  const latestBatch = batches[0] ?? "";

  const fieldsResult = latestBatch
    ? await getFormFields(latestBatch)
    : { success: true as const, data: [] };

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <FormBuilderClient
        initialBatch={latestBatch}
        initialBatches={batches}
        initialFields={fieldsResult.data ?? []}
      />
    </div>
  );
}
