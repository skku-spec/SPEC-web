import { getCachedActivePartners } from "@/lib/partners-public";
import PartnersContent from "@/components/partners/PartnersContent";

const HARDCODED_PARTNERS = [
  { name: "성균관대학교 RISE 사업단", logo: "/images/logos/rise.png" },
  { name: "카카오모빌리티", logo: "/images/logos/kakao.svg" },
  { name: "SL IT", logo: "/images/logos/SL_IT.svg" },
];

export default async function Partners() {
  const dbPartners = await getCachedActivePartners();

  const partners =
    dbPartners.length > 0
      ? dbPartners.map((p) => ({
          name: p.name,
          logo: p.logo_url,
          website_url: p.website_url,
        }))
      : HARDCODED_PARTNERS;

  return <PartnersContent partners={partners} />;
}
