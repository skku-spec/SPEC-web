import type { Metadata } from "next";
import { getAllSettings } from "@/lib/actions/site-settings";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "설정 | SPEC Admin",
};

export default async function AdminSettingsPage() {
  const result = await getAllSettings();

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
        사이트 설정
      </h1>
      <SettingsClient initialSettings={result.data ?? []} />
    </div>
  );
}
