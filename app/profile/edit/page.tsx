import type { Metadata } from "next";

import PageHeader from "@/components/PageHeader";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "프로필 수정 | SPEC",
  description: "SPEC 프로필 정보를 수정합니다.",
};

export default async function ProfileEditPage() {
  const { user, profile } = await requireAuth();

  return (
    <div className="min-h-screen px-4 pb-24 pt-14 md:px-8 md:pt-20">
      <div className="mx-auto max-w-[720px]">
        <PageHeader title="프로필 수정" align="left" />
        <ProfileEditForm
          currentEmail={user.email || ""}
          currentUsername={profile?.username?.trim() || ""}
          currentFirstName={profile?.first_name?.trim() || ""}
          currentLastName={profile?.last_name?.trim() || ""}
          currentLinkedinUrl={profile?.linkedin_url?.trim() || ""}
        />
      </div>
    </div>
  );
}
