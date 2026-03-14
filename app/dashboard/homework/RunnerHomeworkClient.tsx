"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Homework = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export function RunnerHomeworkClient() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
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

    fetchHomeworks();
  }, [supabase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#16140f]">Homework</h1>
        <p className="text-[#6b6b5e]">관리자가 부여한 과제를 확인하고 수행하세요.</p>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6C0F] border-t-transparent" />
          </div>
        ) : homeworks.length === 0 ? (
          <div className="rounded-xl border border-[#d9d9cc] bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5ee]">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-[#16140f]">등록된 과제가 없습니다</h3>
            <p className="mt-1 text-sm text-[#6b6b5e]">새로운 과제가 등록되면 여기에 표시됩니다.</p>
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
                  <button
                    onClick={() => setViewingId(viewingId === hw.id ? null : hw.id)}
                    className="rounded-lg border border-[#d9d9cc] px-3 py-1.5 text-xs font-medium text-[#16140f] transition-colors hover:bg-[#16140f] hover:text-white"
                  >
                    {viewingId === hw.id ? "닫기" : "열람하기"}
                  </button>
                </div>
              </div>
              
              {/* Detail Area */}
              {viewingId === hw.id && (
                <div className="border-t border-[#f0efe6] bg-[#fcfcfb] p-6 animate-in slide-in-from-top-2">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[#4a4a40]">
                    {hw.content || "상세 내용이 없습니다."}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="rounded-lg bg-[#FF6C0F] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                      과제 제출하기
                    </button>
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
