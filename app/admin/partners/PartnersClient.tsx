"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { Plus, Pencil, X, Handshake } from "lucide-react";
import {
  getAllPartners,
  upsertPartner,
  deletePartner,
} from "@/lib/actions/partners";
import type { Partner } from "@/lib/actions/partners";

type PartnerForm = {
  id?: string;
  name: string;
  logo_url: string;
  website_url: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: PartnerForm = {
  name: "",
  logo_url: "",
  website_url: "",
  sort_order: 0,
  is_active: true,
};

type PartnersClientProps = {
  initialPartners: Partner[];
};

export default function PartnersClient({ initialPartners }: PartnersClientProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<PartnerForm>(EMPTY_FORM);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshPartners = useCallback(() => {
    startTransition(async () => {
      const res = await getAllPartners();
      if (res.data) setPartners(res.data);
    });
  }, []);

  const openCreate = () => {
    const maxSort = partners.reduce((max, p) => Math.max(max, p.sort_order), 0);
    setForm({ ...EMPTY_FORM, sort_order: maxSort + 1 });
    setShowEditor(true);
  };

  const openEdit = (partner: Partner) => {
    setForm({
      id: partner.id,
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url ?? "",
      sort_order: partner.sort_order,
      is_active: partner.is_active,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.logo_url.trim()) {
      setToast({ type: "error", message: "이름과 로고 URL은 필수입니다." });
      return;
    }

    startTransition(async () => {
      const res = await upsertPartner({
        id: form.id,
        name: form.name.trim(),
        logo_url: form.logo_url.trim(),
        website_url: form.website_url.trim() || undefined,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });

      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({
          type: "success",
          message: form.id
            ? "파트너가 수정되었습니다."
            : "파트너가 추가되었습니다.",
        });
        closeEditor();
        refreshPartners();
      }
    });
  };

  const confirmDelete = (partner: Partner) => {
    setDeletingPartner(partner);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!deletingPartner) return;

    startTransition(async () => {
      const res = await deletePartner(deletingPartner.id);
      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({ type: "success", message: "파트너가 삭제되었습니다." });
        refreshPartners();
      }
      setShowDeleteDialog(false);
      setDeletingPartner(null);
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
          파트너 관리
        </h1>
        <button
          type="button"
          onClick={openCreate}
          disabled={isPending}
          className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          파트너 추가
        </button>
      </div>

      {toast && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 font-['Pretendard',sans-serif] text-sm ${
            toast.type === "success"
              ? "border-[#2f9e44]/20 bg-[#E6F9E6] text-[#2f9e44]"
              : "border-[#b42318]/20 bg-[#FEE2E2] text-[#b42318]"
          }`}
        >
          {toast.message}
        </div>
      )}

      {showEditor && (
        <div className="mb-6 rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {form.id ? "파트너 수정" : "파트너 추가"}
            </h2>
            <button
              type="button"
              onClick={closeEditor}
              className="text-[#6b6b5e] transition-colors hover:text-[#16140f]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  이름
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="파트너 이름"
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>
              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  로고 URL
                </label>
                <input
                  type="text"
                  value={form.logo_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, logo_url: e.target.value }))
                  }
                  placeholder="/images/logos/partner.svg"
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  웹사이트 URL
                </label>
                <input
                  type="text"
                  value={form.website_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, website_url: e.target.value }))
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>
              <div className="flex gap-4">
                <div className="w-32">
                  <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-[#ddd9cc] accent-[#FF6C0F]"
                    />
                    활성
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-50"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={closeEditor}
                disabled={isPending}
                className="flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {partners.length === 0 && !showEditor ? (
        <div className="rounded-lg border border-[#ddd9cc] bg-white py-16 text-center">
          <Handshake
            className="mx-auto mb-3 h-8 w-8 text-[#6b6b5e]"
            strokeWidth={1.5}
          />
          <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            등록된 파트너가 없습니다.
          </p>
          <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
            &ldquo;파트너 추가&rdquo; 버튼을 눌러 첫 번째 파트너를 등록해보세요.
          </p>
        </div>
      ) : partners.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <table className="w-full">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  이름
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  로고 URL
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  웹사이트
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  순서
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  상태
                </th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-t border-[#ece8db]">
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                    {partner.name}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    {partner.logo_url}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    {partner.website_url ? (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:underline"
                      >
                        {partner.website_url}
                      </a>
                    ) : (
                      <span className="text-[#6b6b5e]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    {partner.sort_order}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                        partner.is_active
                          ? "bg-[#E6F9E6] text-[#2f9e44]"
                          : "bg-[#FEE2E2] text-[#b42318]"
                      }`}
                    >
                      {partner.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(partner)}
                        disabled={isPending}
                        className="flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(partner)}
                        disabled={isPending}
                        className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] transition-colors hover:underline disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showDeleteDialog && deletingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#ddd9cc] bg-white p-6">
            <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              파트너 삭제
            </h3>
            <p className="mb-4 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              &ldquo;{deletingPartner.name}&rdquo; 파트너를 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingPartner(null);
                }}
                disabled={isPending}
                className="flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex h-8 items-center rounded-md bg-[#b42318] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#b42318]/90 disabled:opacity-50"
              >
                {isPending ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
