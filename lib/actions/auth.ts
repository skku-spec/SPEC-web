"use server";

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
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const first_name = readField(formData, "first_name").replace(/\s+/g, "");
  const last_name = readField(formData, "last_name").replace(/\s+/g, "");
  const email = readField(formData, "email").toLowerCase();
  const username = readField(formData, "username");
  const password = readField(formData, "password");
  let linkedin_url = readField(formData, "linkedin_url");

  if (!first_name || !last_name || !email || !username || !password) {
    return { error: "Please complete all required fields." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
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
  const email = readField(formData, "email").toLowerCase();

  if (!email) {
    return { error: "Please enter your email." };
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
    return { error: "Please enter a new password." };
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Please request a new reset link." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("same") || msg.includes("different")) {
      return { error: "New password must be different from your current password." };
    }
    if (msg.includes("weak") || msg.includes("strength")) {
      return { error: "Password is too weak. Please choose a stronger password." };
    }
    return { error: error.message };
  }

  await supabase.auth.signOut({ scope: "global" });
  return { success: true };
}
