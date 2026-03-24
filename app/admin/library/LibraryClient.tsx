"use client";

import { useState, useTransition } from "react";
import CustomSelect from "@/components/ui/CustomSelect";

import { createLibraryItem, deleteLibraryItem } from "@/lib/actions/library";
import type { Database } from "@/lib/supabase/types";

type LibraryItem = Database["public"]["Tables"]["library_items"]["Row"];

type LibraryClientProps = {
  initialItems: LibraryItem[];
};

const TYPE_OPTIONS = ["Video", "Essay", "Podcast", "Guide"];
const CATEGORY_OPTIONS = ["창업-기초", "매출-성장", "IR-투자", "팀빌딩", "VCC", "알럼나이", "기술-MVP"];

function formatDate(date: string) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

export default function LibraryClient({ initialItems }: LibraryClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreateItem = (formData: FormData) => {
    startTransition(() => {
      void (async () => {
        const result = await createLibraryItem(formData);

        if (!result.success) {
          window.alert(result.error ?? "Failed to create library item.");
          return;
        }

        setShowForm(false);
      })();
    });
  };

  const handleDelete = (itemId: string) => {
    const isConfirmed = window.confirm("Delete this library item?");
    if (!isConfirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await deleteLibraryItem(itemId);

        if (!result.success) {
          window.alert(result.error ?? "Failed to delete library item.");
          return;
        }

      })();
    });
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Library</h1>
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="rounded-md bg-[#FF6C0F] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {showForm ? "Close" : "Add Item"}
          </button>
        </div>

        {showForm && (
          <form
            className="mb-6 grid gap-4 rounded-lg border border-[#ddd9cc] bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              handleCreateItem(formData);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-[#4a4a40]">
                Title
                <input
                  name="title"
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>
              <label className="text-sm font-medium text-[#4a4a40]">
                Author
                <input
                  name="author"
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>
              <label className="text-sm font-medium text-[#4a4a40]">
                Author Role
                <input
                  name="authorRole"
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>
              <label className="text-sm font-medium text-[#4a4a40]">
                Type
                <CustomSelect
                  name="type"
                  defaultValue={TYPE_OPTIONS[0]}
                  options={TYPE_OPTIONS}
                  className="mt-1"
                />
              </label>
              <label className="text-sm font-medium text-[#4a4a40]">
                Date
                <input
                  name="date"
                  required
                  placeholder="2026-02-12"
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>
              <label className="text-sm font-medium text-[#4a4a40]">
                Duration
                <input
                  name="duration"
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>
              <label className="text-sm font-medium text-[#4a4a40]">
                YouTube ID
                <input
                  name="youtubeId"
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>
              <label className="text-sm font-medium text-[#4a4a40]">
                Thumbnail Color
                <input
                  type="color"
                  name="thumbnailColor"
                  defaultValue="#f0efe6"
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] bg-white px-1"
                />
              </label>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[#4a4a40]">Categories</legend>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {CATEGORY_OPTIONS.map((category) => (
                  <label key={category} className="inline-flex items-center gap-2 text-sm text-[#4a4a40]">
                    <input type="checkbox" name="categories" value={category} className="h-4 w-4 rounded border-[#ddd9cc]" />
                    {category}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="text-sm font-medium text-[#4a4a40]">
              Description
              <textarea
                name="description"
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-[#ddd9cc] px-3 py-2 text-sm outline-none focus:border-[#FF6C0F]"
              />
            </label>

            <label className="text-sm font-medium text-[#4a4a40]">
              Body
              <textarea
                name="body"
                required
                rows={5}
                className="mt-1 w-full rounded-md border border-[#ddd9cc] px-3 py-2 text-sm outline-none focus:border-[#FF6C0F]"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-[#4a4a40]">
              <input type="checkbox" name="featured" className="h-4 w-4 rounded border-[#ddd9cc]" />
              Featured
            </label>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-[#FF6C0F] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Create Item"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-sm font-semibold">Author</th>
                <th className="px-4 py-3 text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-sm font-semibold">Categories</th>
                <th className="px-4 py-3 text-sm font-semibold">Featured</th>
                <th className="px-4 py-3 text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialItems.map((item) => (
                <tr key={item.id} className="border-t border-[#ece8db]">
                  <td className="px-4 py-3 text-sm font-semibold text-[#16140f]">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{item.author}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{item.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {item.categories.map((category) => (
                        <span
                          key={`${item.id}-${category}`}
                          className="rounded-full bg-[#f0efe6] px-2.5 py-1 text-xs font-medium text-[#4a4a40]"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.featured ? "bg-[#FFF0E5] text-[#FF6C0F]" : "bg-[#f0efe6] text-[#6b6b5e]"
                      }`}
                    >
                      {item.featured ? "Featured" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b6b5e]">{formatDate(item.date)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="text-sm font-semibold text-[#b42318] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
