import type { Metadata } from "next";
import HackathonClient from "./HackathonClient";

export const metadata: Metadata = {
  title: "SPEC Execution Camp | SPEC",
  description:
    "문제 정의부터 가설 검증 결과물 제작까지를 1박 2일 안에 완료하는 SPEC Execution Camp",
};

export default function HackathonPage() {
  return <HackathonClient />;
}
