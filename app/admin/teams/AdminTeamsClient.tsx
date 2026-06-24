"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Network, Plus, Save } from "lucide-react";

import {
  createStartupTeam,
  updateStartupTeamMembers,
  type TeamSpaceData,
  type TeamSpaceProfile,
  type TeamSpaceTeam,
} from "@/lib/actions/team-space";

type AdminTeamsClientProps = {
  initialData: TeamSpaceData;
};

function ProfileCheckboxes({
  profiles,
  defaultIds,
  name,
}: {
  profiles: TeamSpaceProfile[];
  defaultIds?: string[];
  name: string;
}) {
  return (
    <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-[#ddd9cc] bg-white p-3 sm:grid-cols-2">
      {profiles.map((profile) => (
        <label key={profile.id} className="flex items-center gap-2 text-sm text-[#4a4a40]">
          <input
            type="checkbox"
            name={name}
            value={profile.id}
            defaultChecked={defaultIds?.includes(profile.id)}
            className="h-4 w-4 rounded border-[#c9c3b5] text-[#FF6C0F]"
          />
          <span className="truncate">
            {profile.display_name}
            <span className="ml-1 text-xs text-[#8a8578]">{profile.role === "preneur" ? "프러너" : "러너"}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function TeamSettingsForm({
  team,
  profiles,
  preneurs,
  isPending,
  onSubmit,
}: {
  team: TeamSpaceTeam;
  profiles: TeamSpaceProfile[];
  preneurs: TeamSpaceProfile[];
  isPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>, teamId: string) => void;
}) {
  return (
    <form onSubmit={(event) => onSubmit(event, team.id)} className="rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#FF6C0F]">SPEC {team.batch}</p>
          <h2 className="text-xl font-black text-[#16140f]">{team.name}</h2>
          <p className="mt-1 text-sm text-[#6b6b5e]">
            멤버 {team.members.length}명 · KPI {team.kpis.length}개 · 오피스아워 {team.office_hours.length}개
          </p>
        </div>
        <button disabled={isPending} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#ddd9cc] px-3 text-xs font-semibold disabled:opacity-50">
          <Save className="h-3.5 w-3.5" strokeWidth={2} />
          저장
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_110px_180px]">
        <input name="name" required defaultValue={team.name} className="h-10 rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
        <input name="batch" defaultValue={team.batch} className="h-10 rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
        <select name="lead_preneur_id" defaultValue={team.lead_preneur_id ?? ""} className="h-10 rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
          <option value="">담당 프러너</option>
          {preneurs.map((profile) => (
            <option key={profile.id} value={profile.id}>{profile.display_name}</option>
          ))}
        </select>
      </div>
      <textarea name="description" defaultValue={team.description} placeholder="팀 설명" className="mt-3 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm outline-none focus:border-[#FF6C0F]" />
      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold text-[#6b6b5e]">팀원 선택</p>
        <ProfileCheckboxes profiles={profiles} name="member_ids" defaultIds={team.members.map((member) => member.profile_id)} />
      </div>
    </form>
  );
}

export default function AdminTeamsClient({ initialData }: AdminTeamsClientProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const preneurs = useMemo(() => initialData.eligibleProfiles.filter((profile) => profile.role === "preneur"), [initialData.eligibleProfiles]);

  function runForm(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.success) {
        setMessage(result.error ?? "요청을 처리하지 못했습니다.");
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  function updateTeam(event: FormEvent<HTMLFormElement>, teamId: string) {
    runForm(event, (formData) => updateStartupTeamMembers(teamId, formData));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#FFF0E5] px-3 py-1 text-xs font-semibold text-[#FF6C0F]">
            <Network className="h-4 w-4" strokeWidth={2} />
            Team Building
          </p>
          <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">팀빌딩 세팅</h1>
          <p className="mt-2 text-sm text-[#6b6b5e]">팀 생성, 담당 프러너 지정, 러너/프러너 멤버 배정을 관리합니다.</p>
        </div>
      </div>

      {message ? (
        <div className="mb-5 rounded-lg border border-[#f2b8b5] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
          {message}
        </div>
      ) : null}

      {initialData.setupError ? (
        <div className="mb-5 rounded-lg border border-[#f2b8b5] bg-[#fff5f5] px-4 py-4 text-sm text-[#b42318]">
          <p className="font-bold">{initialData.setupError}</p>
          <p className="mt-1 text-[#7a271a]">Supabase SQL 적용 후 팀빌딩 세팅을 사용할 수 있습니다.</p>
        </div>
      ) : null}

      <form onSubmit={(event) => runForm(event, createStartupTeam)} className="mb-6 rounded-lg border border-[#ddd9cc] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
          <h2 className="text-sm font-bold">새 팀 만들기</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_110px_180px]">
          <input name="name" required placeholder="팀명" className="h-10 rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
          <input name="batch" defaultValue="4" className="h-10 rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
          <select name="lead_preneur_id" className="h-10 rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
            <option value="">담당 프러너</option>
            {preneurs.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.display_name}</option>
            ))}
          </select>
        </div>
        <textarea name="description" placeholder="팀 설명" className="mt-3 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm outline-none focus:border-[#FF6C0F]" />
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold text-[#6b6b5e]">팀원 선택</p>
          <ProfileCheckboxes profiles={initialData.eligibleProfiles} name="member_ids" />
        </div>
        <button disabled={isPending} className="mt-4 h-10 rounded-md bg-[#16140f] px-4 text-sm font-semibold text-white disabled:opacity-50">
          팀 생성
        </button>
      </form>

      <div className="space-y-4">
        {initialData.teams.length === 0 ? (
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-8 text-center text-sm text-[#6b6b5e]">
            아직 생성된 팀이 없습니다.
          </div>
        ) : (
          initialData.teams.map((team) => (
            <TeamSettingsForm
              key={team.id}
              team={team}
              profiles={initialData.eligibleProfiles}
              preneurs={preneurs}
              isPending={isPending}
              onSubmit={updateTeam}
            />
          ))
        )}
      </div>
    </div>
  );
}
