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
  const firstName = readField(formData, "first_name").replace(/\s+/g, "");
  const lastName = readField(formData, "last_name").replace(/\s+/g, "");
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
      name: lastName + firstName,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("same") || msg.includes("different")) {
      return { error: "현재 비밀번호와 동일한 비밀번호입니다. 다른 비밀번호를 입력해주세요." };
    }
    if (msg.includes("weak") || msg.includes("strength")) {
      return { error: "비밀번호가 너무 약합니다. 더 복잡한 비밀번호를 입력해주세요." };
    }
    if (msg.includes("session") || msg.includes("token") || msg.includes("unauthorized")) {
      return { error: "세션이 만료되었습니다. 다시 로그인 후 시도해주세요." };
    }
    return { error: `비밀번호 변경에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/profile");
  return { success: true };
}
