"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";

import { createTag, updateTag, deleteTag } from "@/lib/actions/tags";
import type { TagWithPostCount } from "@/lib/actions/tags";

type TagsClientProps = {
  initialTags: TagWithPostCount[];
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function TagsClient({ initialTags }: TagsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addLabel, setAddLabel] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const runAction = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(() => {
      void (async () => {
        const result = await action();

        if (!result.success) {
          window.alert(result.error ?? "Action failed.");
        }
      })();
    });
  };

  const handleAdd = () => {
    const slug = addSlug.trim() || slugify(addLabel);
    runAction(async () => {
      const result = await createTag(addLabel, slug);
      if (result.success) {
        setAddLabel("");
        setAddSlug("");
        setShowAddForm(false);
      }
      return result;
    });
  };

  const handleUpdate = (tagId: string) => {
    const slug = editSlug.trim() || slugify(editLabel);
    runAction(async () => {
      const result = await updateTag(tagId, editLabel, slug);
      if (result.success) {
        setEditingId(null);
        setEditLabel("");
        setEditSlug("");
      }
      return result;
    });
  };

  const handleDelete = (tagId: string) => {
    if (!window.confirm("이 태그를 삭제하시겠습니까? 연결된 게시물 태그도 함께 제거됩니다.")) {
      return;
    }
    runAction(() => deleteTag(tagId));
  };

  const startEdit = (tag: TagWithPostCount) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditSlug(tag.slug);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditSlug("");
  };

  const openAddForm = () => {
    setShowAddForm(true);
    setEditingId(null);
    setAddLabel("");
    setAddSlug("");
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setAddLabel("");
    setAddSlug("");
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">
            태그 관리
          </h1>
          <button
            type="button"
            onClick={openAddForm}
            disabled={isPending || showAddForm}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#FF6C0F] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            태그 추가
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                  태그 이름
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                  슬러그
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                  게시물 수
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {showAddForm && (
                <tr className="border-t border-[#ece8db]">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={addLabel}
                      onChange={(e) => {
                        setAddLabel(e.target.value);
                        setAddSlug(slugify(e.target.value));
                      }}
                      placeholder="태그 이름"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 focus:outline-none"
                      disabled={isPending}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={addSlug}
                      onChange={(e) => setAddSlug(e.target.value)}
                      placeholder="자동 생성"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 focus:outline-none"
                      disabled={isPending}
                    />
                  </td>
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    &mdash;
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAdd}
                        disabled={isPending || !addLabel.trim()}
                        className="h-8 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={cancelAdd}
                        disabled={isPending}
                        className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        취소
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {initialTags.length === 0 && !showAddForm ? (
                <tr className="border-t border-[#ece8db]">
                  <td
                    colSpan={4}
                    className="py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]"
                  >
                    등록된 태그가 없습니다.
                  </td>
                </tr>
              ) : (
                initialTags.map((tag) =>
                  editingId === tag.id ? (
                    <tr key={tag.id} className="border-t border-[#ece8db]">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => {
                            setEditLabel(e.target.value);
                            setEditSlug(slugify(e.target.value));
                          }}
                          className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 focus:outline-none"
                          disabled={isPending}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 focus:outline-none"
                          disabled={isPending}
                        />
                      </td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                        {tag.postCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate(tag.id)}
                            disabled={isPending || !editLabel.trim()}
                            className="h-8 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isPending}
                            className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={tag.id} className="border-t border-[#ece8db]">
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        {tag.label}
                      </td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                        {tag.slug}
                      </td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                        {tag.postCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(tag)}
                            disabled={isPending}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil className="h-3 w-3" strokeWidth={2} />
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tag.id)}
                            disabled={isPending}
                            className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
