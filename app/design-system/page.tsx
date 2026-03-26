import type { Metadata } from "next";
import { DesignSystemClient } from "./DesignSystemClient";

export const metadata: Metadata = {
  title: "디자인 시스템 | SPEC",
};

export default function DesignSystemPage() {
  return <DesignSystemClient />;
}
