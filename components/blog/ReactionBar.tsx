"use client";

import type { LucideIcon } from "lucide-react";
import { Eye, Flame, Heart, PartyPopper, ThumbsUp, CircleHelp } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  toggleReaction,
  type ReactionSummary,
} from "@/lib/actions/reactions";

const REACTION_KEYS = ["👍", "🔥", "❤️", "🎉", "🤔", "👀"] as const;

const REACTION_CONFIG: Record<string, { icon: LucideIcon; label: string }> = {
  "👍": { icon: ThumbsUp, label: "좋아요" },
  "🔥": { icon: Flame, label: "불꽃" },
  "❤️": { icon: Heart, label: "하트" },
  "🎉": { icon: PartyPopper, label: "축하" },
  "🤔": { icon: CircleHelp, label: "궁금" },
  "👀": { icon: Eye, label: "관심" },
};

type ReactionBarProps = {
  postId: string;
  initialReactions: ReactionSummary[];
  userId?: string;
};

type ReactionsByKey = Record<string, { count: number; userIds: string[] }>;

function toReactionMap(items: ReactionSummary[]): ReactionsByKey {
  const base = REACTION_KEYS.reduce<ReactionsByKey>((acc, key) => {
    acc[key] = { count: 0, userIds: [] };
    return acc;
  }, {});

  for (const item of items) {
    if (!base[item.emoji]) {
      continue;
    }

    base[item.emoji] = {
      count: item.count,
      userIds: item.userIds,
    };
  }

  return base;
}

export default function ReactionBar({ postId, initialReactions, userId }: ReactionBarProps) {
  const [isPending, startTransition] = useTransition();
  const [reactions, setReactions] = useState<ReactionsByKey>(() => toReactionMap(initialReactions));

  useEffect(() => {
    setReactions(toReactionMap(initialReactions));
  }, [initialReactions]);

  const reactionEntries = useMemo(
    () => REACTION_KEYS.map((key) => ({ key, ...reactions[key] })),
    [reactions],
  );

  const handleToggle = (key: string) => {
    if (!userId || isPending) {
      return;
    }

    const prev = reactions;
    const hasReacted = prev[key].userIds.includes(userId);

    const optimistic: ReactionsByKey = {
      ...prev,
      [key]: {
        count: hasReacted ? Math.max(0, prev[key].count - 1) : prev[key].count + 1,
        userIds: hasReacted
          ? prev[key].userIds.filter((id) => id !== userId)
          : [...prev[key].userIds, userId],
      },
    };

    setReactions(optimistic);

    startTransition(async () => {
      const result = await toggleReaction(postId, key);
      if (!result.success) {
        setReactions(prev);
      }
    });
  };

  return (
    <section className="mt-8">
      <p className="mb-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
        리액션
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {reactionEntries.map(({ key, count, userIds }) => {
          const isActive = userId != null && userIds.includes(userId);
          const isEmpty = count === 0;
          const config = REACTION_CONFIG[key];
          const Icon = config.icon;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              title={userId ? config.label : "로그인 후 반응을 남길 수 있어요"}
              aria-label={`${config.label} ${count}`}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-['Pretendard',sans-serif] text-sm transition-colors disabled:cursor-not-allowed ${
                isActive
                  ? "border-[#FF6C0F] bg-[#FFF0E5] text-[#FF6C0F]"
                  : "border-[#ddd9cc] bg-[#f5f5ee] text-[#6b6b5e]"
              } ${isEmpty && !isActive ? "opacity-60" : ""}`}
              disabled={isPending}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
              <span className="min-w-[1ch] text-xs font-semibold">{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
