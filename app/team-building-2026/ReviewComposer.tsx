"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import {
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core/extensions";
import { BlockNoteView } from "@blocknote/mantine";
import { Target } from "lucide-react";

import { createTeamReviewPost } from "@/lib/actions/team-space";
import { uploadTeamBuildingImage } from "@/lib/storage";
import type {
  TeamKpiOption,
  TeamSummary,
} from "@/app/team-building-2026/TeamBuildingCommunity";

type ReviewComposerProps = {
  team: TeamSummary;
  kpis: TeamKpiOption[];
  reportType?: "cta" | "coffee_chat" | "free_review";
  heading?: string;
  description?: string;
  submitLabel?: string;
  defaultTitle?: string;
  periodStart?: string;
  periodEnd?: string;
  roundNumber?: number;
};

export default function ReviewComposer({
  team,
  kpis,
  reportType = "free_review",
  heading = "KPI 리뷰 작성",
  description = "KPI 설정 배경, 달성 과정, 배운 점을 팀 피드에 공유합니다.",
  submitLabel = "리뷰 등록",
  defaultTitle = "",
  periodStart,
  periodEnd,
  roundNumber,
}: ReviewComposerProps) {
  const router = useRouter();
  const editor = useCreateBlockNote({
    uploadFile: async (file) => uploadTeamBuildingImage(team.id, file),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const slashMenuItems = useMemo(() => {
    const kpiText = kpis.length > 0
      ? `KPI 업데이트: ${kpis.map((kpi) => `${kpi.title} ${kpi.isMeasured ? `${kpi.achievementRate}%` : "미측정"}`).join(" / ")}`
      : "KPI 업데이트: 아직 등록된 KPI가 없습니다.";

    return async (query: string) => filterSuggestionItems(
      [
        {
          title: "KPI",
          subtext: "현재 팀 KPI 요약을 본문에 삽입합니다.",
          aliases: ["kpi", "KPI", "케이피아이", "지표"],
          group: "Team Building",
          icon: <Target className="h-4 w-4" strokeWidth={2} />,
          onItemClick: () => {
            insertOrUpdateBlockForSlashMenu(editor, {
              type: "paragraph",
              content: kpiText,
            });
          },
          key: "paragraph" as const,
        },
        ...getDefaultReactSlashMenuItems(editor),
      ],
      query,
    );
  }, [editor, kpis]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const markdown = editor.blocksToMarkdownLossy(editor.document);
    const contentBlocks = [{ type: "blocknote", blocks: editor.document, markdown }];

    formData.set("team_id", team.id);
    formData.set("report_type", reportType);
    formData.set("content_blocks", JSON.stringify(contentBlocks));
    if (!formData.get("content")) formData.set("content", markdown);
    if (periodStart) formData.set("period_start", periodStart);
    if (periodEnd) formData.set("period_end", periodEnd);
    if (typeof roundNumber === "number") formData.set("round_number", String(roundNumber));
    setMessage(null);

    startTransition(async () => {
      const result = await createTeamReviewPost(formData);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      form.reset();
      editor.replaceBlocks(editor.document, [{ type: "paragraph" }]);
      setMessage("보고서가 등록되었습니다.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mb-5 rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-black text-[#1A1A1A]">{heading}</h2>
        <p className="mt-1 text-sm text-[#6b6b5e]">{description}</p>
      </div>

      {message ? <p className="mb-3 rounded-lg bg-[#f5f5ee] px-3 py-2 text-sm font-semibold text-[#4a4a40]">{message}</p> : null}

      <div className="space-y-3">
        <label className="block text-xs font-bold text-[#6b6b5e]">
          제목
          <input name="title" required defaultValue={defaultTitle} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
        </label>
        <input type="hidden" name="content" />
        <div className="space-y-2 rounded-lg border border-[#ddd9cc] bg-[#fbfaf4] p-3">
          <p className="text-xs font-bold text-[#6b6b5e]">본문</p>
          <div className="team-review-editor min-h-52 rounded-lg border border-[#ddd9cc] bg-white p-3">
            <BlockNoteView editor={editor} theme="light" slashMenu={false}>
              <SuggestionMenuController triggerCharacter="/" getItems={slashMenuItems} />
            </BlockNoteView>
          </div>
          <p className="text-xs font-semibold text-[#8a877c]"># 입력 후 Space를 누르면 제목 블록으로 전환됩니다. 이미지도 에디터 안에 붙여넣거나 드래그할 수 있습니다.</p>
        </div>

        <button disabled={isPending} className="h-10 rounded-md bg-[#16140f] px-4 text-xs font-semibold text-white disabled:opacity-50">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
