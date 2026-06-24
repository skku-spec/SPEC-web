import { redirect } from "next/navigation";

import { getMyTeamSpacePath } from "@/lib/actions/team-space";

export default async function MyTeamSpacePage() {
  redirect(await getMyTeamSpacePath());
}
