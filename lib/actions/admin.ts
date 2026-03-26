"use server";

import { revalidatePath } from "next/cache";

import { isAdmin, type UserRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/helpers/audit-log";
import { createClient } from "@/lib/supabase/server";

type AdminActionResult = {
  success: boolean;
  error?: string;
};

const VALID_ROLES: Record<UserRole, string> = {
  outsider: "외부인",
  learner: "러너",
  alumni: "동문",
  preneur: "프러너",
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
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfileError) {
      throw new Error(`Failed to verify admin permissions: ${callerProfileError.message}`);
    }

    if (!isAdmin(callerProfile)) {
      throw new Error("Only admins can manage user roles.");
    }



    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (updateError) {
      throw new Error(`Failed to update user role: ${updateError.message}`);
    }

    await logAuditEvent({
      action: "role_change",
      entityType: "user",
      entityId: userId,
      details: { newRole },
    });

    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role.",
    };
  }
}

export async function toggleAdminStatus(userId: string, isAdminStatus: boolean): Promise<AdminActionResult> {
  try {
    if (!userId) {
      throw new Error("Target user is required.");
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
      throw new Error("You must be logged in to manage admin status.");
    }

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfileError) {
      throw new Error(`Failed to verify admin permissions: ${callerProfileError.message}`);
    }

    if (!isAdmin(callerProfile)) {
      throw new Error("Only admins can manage admin status.");
    }

    if (!isAdminStatus) {
      const { error } = await supabase.rpc("safe_remove_admin", { target_user_id: userId });
      if (error) {
        if (error.message.includes("last admin")) {
          return { success: false, error: "마지막 관리자는 해제할 수 없습니다." };
        }
        if (error.message.includes("not found") || error.message.includes("not an admin")) {
          return { success: false, error: "사용자를 찾을 수 없거나 관리자가 아닙니다." };
        }
        return { success: false, error: error.message };
      }
    } else {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_admin: isAdminStatus })
        .eq("id", userId);

      if (updateError) {
        throw new Error(`Failed to update admin status: ${updateError.message}`);
      }
    }

    await logAuditEvent({
      action: "status_change",
      entityType: "user",
      entityId: userId,
      details: { is_admin: isAdminStatus },
    });

    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update admin status.",
    };
  }
}
