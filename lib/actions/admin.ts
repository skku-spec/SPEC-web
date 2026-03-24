"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type UserRole = "outsider" | "runner" | "preneur" | "member" | "admin";

type AdminActionResult = {
  success: boolean;
  error?: string;
};

const VALID_ROLES: Record<UserRole, string> = {
  outsider: "외부인",
  runner: "러너",
  preneur: "프러너",
  member: "부원",
  admin: "관리자",
};

function isValidRole(role: string): role is UserRole {
  return role in VALID_ROLES;
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<AdminActionResult> {
  try {
    if (!userId) {
      throw new Error("Target user is required.");
    }

    if (!isValidRole(newRole)) {
      throw new Error("Invalid role provided.");
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`Authentication failed: ${userError.message}`);
    }

    if (!user) {
      throw new Error("You must be logged in to manage roles.");
    }

    if (user.id === userId) {
      throw new Error("You cannot change your own role.");
    }

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfileError) {
      throw new Error(`Failed to verify admin permissions: ${callerProfileError.message}`);
    }

    if (callerProfile?.role !== "admin") {
      throw new Error("Only admins can manage user roles.");
    }



    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (updateError) {
      throw new Error(`Failed to update user role: ${updateError.message}`);
    }

    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role.",
    };
  }
}
