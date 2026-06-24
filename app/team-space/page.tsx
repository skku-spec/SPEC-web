import TeamSpaceClient from "@/app/team-space/TeamSpaceClient";
import { getTeamSpaceData } from "@/lib/actions/team-space";

export default async function TeamSpacePage() {
  const data = await getTeamSpaceData();
  return <TeamSpaceClient initialData={data} />;
}
