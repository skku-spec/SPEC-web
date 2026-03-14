"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Homework = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export function HomeworkClient() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const fetchHomeworks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("homeworks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHomeworks(data);
    }
    setIsLoading(false);
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { data, error } = await supabase
      .from("homeworks")
      .insert([
        {
          title: newTitle,
          content: newContent,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setHomeworks([data, ...homeworks]);
      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
    } else {
      alert("과제 생성 중 에러가 발생했습니다.");
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("homeworks").delete().eq("id", id);
    if (!error) {
      setHomeworks(homeworks.filter((hw) => hw.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#16140f]">Homework Management</h1>
          <p className="text-[#6b6b5e]">사용자들의 과제 제출 현황을 관리하고 검토합니다.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95 ${
            isAdding ? "bg-[#6b6b5e] rotate-45" : "bg-[#FF6C0F] shadow-orange-200"
          }`}
        >
          <span className="text-2xl font-light leading-none">+</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleAddHomework}
          className="animate-in fade-in slide-in-from-top-4 rounded-xl border border-[#d9d9cc] bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#16140f] mb-1">과제 제목</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full rounded-lg border border-[#d9d9cc] px-4 py-2 text-sm focus:border-[#FF6C0F] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#16140f] mb-1">과제 내용</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="상세 내용을 입력하세요"
                rows={4}
                className="w-full rounded-lg border border-[#d9d9cc] px-4 py-2 text-sm focus:border-[#FF6C0F] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#6b6b5e] hover:bg-[#f5f5ee]"
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#16140f] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                과제 생성
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6C0F] border-t-transparent" />
          </div>
        ) : homeworks.length === 0 ? (
          <div className="rounded-xl border border-[#d9d9cc] bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5ee]">
              <span className="text-3xl">📖</span>
            </div>
            <h3 className="text-lg font-semibold text-[#16140f]">데이터가 없습니다</h3>
            <p className="mt-1 text-sm text-[#6b6b5e]">우측 상단의 + 버튼을 눌러 첫 과제를 만드세요.</p>
          </div>
        ) : (
          homeworks.map((hw) => (
            <div key={hw.id} className="group overflow-hidden rounded-xl border border-[#d9d9cc] bg-white transition-all hover:border-[#FF6C0F] hover:shadow-md">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5ee] text-base group-hover:bg-[#FFF0E5]">📖</span>
                  <h3 className="font-semibold text-[#16140f]">{hw.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#a1a196]">
                    {new Date(hw.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingId(viewingId === hw.id ? null : hw.id)}
                      className="rounded-lg border border-[#d9d9cc] px-3 py-1.5 text-xs font-medium text-[#16140f] transition-colors hover:bg-[#16140f] hover:text-white"
                    >
                      {viewingId === hw.id ? "닫기" : "열람하기"}
                    </button>
                    <button
                      onClick={() => handleDeleteHomework(hw.id)}
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Detail Area */}
              {viewingId === hw.id && (
                <div className="border-t border-[#f0efe6] bg-[#fcfcfb] p-6 animate-in slide-in-from-top-2">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[#4a4a40]">
                    {hw.content || "상세 내용이 없습니다."}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

