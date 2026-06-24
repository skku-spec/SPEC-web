import TeamSpaceClient from "@/app/team-space/TeamSpaceClient";
import { getTeamSpaceData } from "@/lib/actions/team-space";

type TeamSpaceDetailPageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamSpaceDetailPage({ params }: TeamSpaceDetailPageProps) {
  const [{ teamId }, data] = await Promise.all([params, getTeamSpaceData()]);
  return <TeamSpaceClient initialData={data} initialTeamId={teamId} />;
}
