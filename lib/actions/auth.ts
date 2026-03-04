"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const first_name = readField(formData, "first_name");
  const last_name = readField(formData, "last_name");
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

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
