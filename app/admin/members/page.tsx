import { getAllMembers } from "@/lib/actions/members";
import MembersClient from "./MembersClient";

export default async function AdminMembersPage() {
  const result = await getAllMembers();
  return <MembersClient initialMembers={result.data ?? []} />;
}
