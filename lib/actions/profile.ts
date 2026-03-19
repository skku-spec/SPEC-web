"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: boolean;
};

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const username = readField(formData, "username");
  const firstName = readField(formData, "first_name");
  const lastName = readField(formData, "last_name");
  let linkedinUrl = readField(formData, "linkedin_url");

  if (!username || !firstName || !lastName) {
    return { error: "Username, First Name, Last Name은 필수입니다." };
  }

  if (linkedinUrl) {
    if (!linkedinUrl.startsWith("http://") && !linkedinUrl.startsWith("https://")) {
      linkedinUrl = "https://" + linkedinUrl;
    }

    try {
      const parsed = new URL(linkedinUrl);
      if (!parsed.hostname.includes("linkedin.com")) {
        return { error: "올바른 LinkedIn URL을 입력해주세요." };
      }
    } catch {
      return { error: "올바른 LinkedIn URL을 입력해주세요." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      first_name: firstName,
      last_name: lastName,
      linkedin_url: linkedinUrl,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 사용 중인 username입니다." };
    }
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function updateEmail(formData: FormData): Promise<ActionResult> {
  const newEmail = readField(formData, "email").toLowerCase();

  if (!newEmail) {
    return { error: "이메일을 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const newPassword = readField(formData, "new_password");
  const confirmPassword = readField(formData, "confirm_password");

  if (!newPassword) {
    return { error: "새 비밀번호를 입력해주세요." };
  }

  if (newPassword.length < 6) {
    return { error: "비밀번호는 최소 6자 이상이어야 합니다." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
