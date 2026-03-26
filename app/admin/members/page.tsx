import type { Metadata } from "next";
import { getAllMembers } from "@/lib/actions/members";
import MembersClient from "./MembersClient";

export const metadata: Metadata = {
  title: "멤버 관리 | SPEC Admin",
};

export default async function AdminMembersPage() {
  const result = await getAllMembers();
  return <MembersClient initialMembers={result.data ?? []} />;
}
