import type { Metadata } from "next";
import { getAllPartners } from "@/lib/actions/partners";
import PartnersClient from "./PartnersClient";

export const metadata: Metadata = {
  title: "파트너 관리 | SPEC Admin",
};

export default async function AdminPartnersPage() {
  const result = await getAllPartners();
  return <PartnersClient initialPartners={result.data ?? []} />;
}
