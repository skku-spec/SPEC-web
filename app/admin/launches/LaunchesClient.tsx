"use client";

import { useState, useTransition } from "react";

import { createLaunch, deleteLaunch } from "@/lib/actions/launches";
import type { Database } from "@/lib/supabase/types";

type Launch = Database["public"]["Tables"]["launches"]["Row"];

type LaunchesClientProps = {
  initialLaunches: Launch[];
};

type LaunchFormState = {
  company: string;
  tagline: string;
  description: string;
  category: string;
  batch: string;
  slug: string;
};

const INITIAL_FORM_STATE: LaunchFormState = {
  company: "",
  tagline: "",
  description: "",
  category: "",
  batch: "",
  slug: "",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function LaunchesClient({ initialLaunches }: LaunchesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LaunchFormState>(INITIAL_FORM_STATE);
  const [isPending, startTransition] = useTransition();

  const handleCreateLaunch = () => {
    const formData = new FormData();
    formData.set("company", form.company);
    formData.set("tagline", form.tagline);
    formData.set("description", form.description);
    formData.set("category", form.category);
    formData.set("batch", form.batch);
    formData.set("slug", form.slug);

    startTransition(() => {
      void (async () => {
        const result = await createLaunch(formData);

        if (!result.success) {
          window.alert(result.error ?? "Failed to create launch.");
          return;
        }

        setForm(INITIAL_FORM_STATE);
        setShowForm(false);
      })();
    });
  };

  const handleDelete = (launchId: string) => {
    const isConfirmed = window.confirm("Delete this launch?");
    if (!isConfirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await deleteLaunch(launchId);

        if (!result.success) {
          window.alert(result.error ?? "Failed to delete launch.");
          return;
        }

      })();
    });
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Launches</h1>
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="rounded-md bg-[#FF6C0F] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {showForm ? "Close" : "Add Launch"}
          </button>
        </div>

        {showForm && (
          <form
            className="mb-6 grid gap-4 rounded-lg border border-[#ddd9cc] bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateLaunch();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-[#4a4a40]">
                Company
                <input
                  value={form.company}
                  onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                  onBlur={() => {
                    setForm((current) => ({ ...current, slug: slugify(current.company) }));
                  }}
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>

              <label className="text-sm font-medium text-[#4a4a40]">
                Tagline
                <input
                  value={form.tagline}
                  onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>

              <label className="text-sm font-medium text-[#4a4a40]">
                Category
                <input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>

              <label className="text-sm font-medium text-[#4a4a40]">
                Batch
                <input
                  value={form.batch}
                  onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>

              <label className="text-sm font-medium text-[#4a4a40] md:col-span-2">
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
                />
              </label>
            </div>

            <label className="text-sm font-medium text-[#4a4a40]">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                required
                rows={4}
                className="mt-1 w-full rounded-md border border-[#ddd9cc] px-3 py-2 text-sm outline-none focus:border-[#FF6C0F]"
              />
            </label>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-[#FF6C0F] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Create Launch"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold">Company</th>
                <th className="px-4 py-3 text-sm font-semibold">Tagline</th>
                <th className="px-4 py-3 text-sm font-semibold">Category</th>
                <th className="px-4 py-3 text-sm font-semibold">Batch</th>
                <th className="px-4 py-3 text-sm font-semibold">Votes</th>
                <th className="px-4 py-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialLaunches.map((launch) => (
                <tr key={launch.id} className="border-t border-[#ece8db]">
                  <td className="px-4 py-3 text-sm font-semibold text-[#16140f]">{launch.company}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{launch.tagline}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{launch.category}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{launch.batch}</td>
                  <td className="px-4 py-3 text-sm text-[#6b6b5e]">{launch.votes}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(launch.id)}
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
