"use client";

import { useMemo, useState } from "react";

import IdeathonTeamProfileForm from "@/app/ideathon/IdeathonTeamProfileForm";
import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";

type Props = {
  readonly initialData: IdeathonBoardData;
  readonly failureDepartment: string;
  readonly failureMessage: string;
};

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readTags(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export default function IdeathonProfileHarnessClient({ initialData, failureDepartment, failureMessage }: Props) {
  const [profile, setProfile] = useState(initialData.myProfile);

  const data = useMemo<IdeathonBoardData>(
    () => ({
      ...initialData,
      myProfile: profile,
      profiles: profile === null ? [] : [{ ...profile, name: initialData.currentUser.name, role: initialData.currentUser.role }],
    }),
    [initialData, profile],
  );

  const saveProfile = async (formData: FormData) => {
    const department = readText(formData, "department");
    if (department === failureDepartment) {
      return { success: false as const, error: failureMessage };
    }

    if (profile === null) {
      return { success: false as const, error: failureMessage };
    }

    setProfile({
      ...profile,
      photo_url: readText(formData, "photo_url"),
      department,
      major: readText(formData, "major") || null,
      age: Number(readText(formData, "age")),
      student_id: readText(formData, "student_id"),
      grade: readText(formData, "grade"),
      ability_tags: readTags(formData, "ability_tags"),
      interest_tags: readTags(formData, "interest_tags"),
      startup_reason: readText(formData, "startup_reason"),
      team_style: readText(formData, "team_style"),
      december_goal: readText(formData, "december_goal"),
      looking_for_teammates: readText(formData, "looking_for_teammates"),
      appeal: readText(formData, "appeal") || null,
      portfolio_url: readText(formData, "portfolio_url") || null,
      sns_url: readText(formData, "sns_url") || null,
      updated_at: new Date().toISOString(),
    });

    return { success: true as const };
  };

  return (
    <main className="min-h-screen bg-[#f5f5ee] px-5 py-6">
      <div className="mx-auto max-w-[720px]">
        <IdeathonTeamProfileForm data={data} onSaved={async () => {}} saveProfile={saveProfile} />
      </div>
    </main>
  );
}
