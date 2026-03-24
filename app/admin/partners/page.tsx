import { getAllPartners } from "@/lib/actions/partners";
import PartnersClient from "./PartnersClient";

export default async function AdminPartnersPage() {
  const result = await getAllPartners();
  return <PartnersClient initialPartners={result.data ?? []} />;
}
