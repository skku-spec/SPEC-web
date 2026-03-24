import { getSettingsMap } from "@/lib/actions/site-settings";

const FALLBACKS: Record<string, string> = {
  contact_general_email: "specskku@gmail.com",
  contact_apply_email: "specskku@gmail.com",
  contact_partnership_email: "specskku@gmail.com",
  contact_press_email: "specskku@gmail.com",
  contact_office_address: "서울특별시 종로구 성균관로 25-2 성균관대학교",
  social_instagram: "https://www.instagram.com/spec.skku/",
  social_linkedin: "https://www.linkedin.com/company/specskku/",
  social_website: "https://specskku.com",
};

export async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const result = await getSettingsMap();
    if (result.success && result.data) {
      return { ...FALLBACKS, ...result.data };
    }
    return FALLBACKS;
  } catch {
    return FALLBACKS;
  }
}
