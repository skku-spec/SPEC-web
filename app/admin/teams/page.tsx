import AdminTeamsClient from "@/app/admin/teams/AdminTeamsClient";
import { getAdminTeamSpaceData } from "@/lib/actions/team-space";

export default async function AdminTeamsPage() {
  const data = await getAdminTeamSpaceData();
  return <AdminTeamsClient initialData={data} />;
}
