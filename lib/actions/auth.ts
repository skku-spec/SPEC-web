"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

type AuthActionResult = {
  error?: string;
  success?: boolean;
};

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitResult = rateLimit(`signIn:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimitResult.allowed) {
    return { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." };
  }

  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitResult = rateLimit(`signUp:${ip}`, { maxRequests: 3, windowMs: 15 * 60 * 1000 });
  if (!rateLimitResult.allowed) {
    return { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." };
  }

  const first_name = readField(formData, "first_name").replace(/\s+/g, "");
  const last_name = readField(formData, "last_name").replace(/\s+/g, "");
  const email = readField(formData, "email").toLowerCase();
  const username = readField(formData, "username");
  const password = readField(formData, "password");
  let linkedin_url = readField(formData, "linkedin_url");

  if (!first_name || !last_name || !email || !username || !password) {
    return { error: "모든 필수 항목을 입력해주세요." };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  if (linkedin_url) {
    if (!linkedin_url.startsWith("http://") && !linkedin_url.startsWith("https://")) {
      linkedin_url = "https://" + linkedin_url;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        name: last_name + first_name,
        username,
        linkedin_url,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function forgotPassword(formData: FormData): Promise<AuthActionResult> {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitResult = rateLimit(`forgotPassword:${ip}`, { maxRequests: 3, windowMs: 15 * 60 * 1000 });
  if (!rateLimitResult.allowed) {
    return { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." };
  }

  const email = readField(formData, "email").toLowerCase();

  if (!email) {
    return { error: "이메일을 입력해주세요." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<AuthActionResult> {
  const newPassword = readField(formData, "new_password");
  const confirmPassword = readField(formData, "confirm_password");

  if (!newPassword) {
    return { error: "새 비밀번호를 입력해주세요." };
  }

  if (newPassword.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "세션이 만료되었습니다. 비밀번호 재설정 링크를 다시 요청해주세요." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("same") || msg.includes("different")) {
      return { error: "새 비밀번호는 현재 비밀번호와 달라야 합니다." };
    }
    if (msg.includes("weak") || msg.includes("strength")) {
      return { error: "비밀번호가 너무 약합니다. 더 강한 비밀번호를 선택해주세요." };
    }
    return { error: error.message };
  }

  await supabase.auth.signOut({ scope: "global" });
  return { success: true };
}
