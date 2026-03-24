"use client";

import { useState, useTransition, useRef } from "react";

import { createJob, updateJob, deleteJob, toggleJobActive } from "@/lib/actions/jobs";
import { uploadJobLogo } from "@/lib/storage";
import type { Database } from "@/lib/supabase/types";
import CustomSelect from "@/components/ui/CustomSelect";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

type JobsClientProps = {
  initialJobs: Job[];
};

const ROLE_OPTIONS = ["개발", "기획", "디자인", "마케팅", "운영"];
const LOCATION_OPTIONS = ["서울", "판교", "부산", "Remote"];

const INPUT_CLS = "mt-1 h-10 w-full rounded-md border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]";
const LABEL_CLS = "text-sm font-medium text-[#4a4a40]";

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

function JobForm({
  job,
  isPending,
  onSubmit,
  onCancel,
}: {
  job?: Job;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(job);
  const [logoPreview, setLogoPreview] = useState<string>(job?.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUrlRef = useRef<string>(job?.logo_url ?? "");

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadJobLogo(file);
      logoUrlRef.current = url;
      setLogoPreview(url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to upload logo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    logoUrlRef.current = "";
    setLogoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("logoUrl", logoUrlRef.current);
    onSubmit(formData);
  };

  return (
    <form className="mb-6 grid gap-4 rounded-lg border border-[#ddd9cc] bg-white p-5" onSubmit={handleFormSubmit}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{isEdit ? "Edit Job" : "New Job"}</h2>
        <button type="button" onClick={onCancel} className="text-sm text-[#6b6b5e] hover:underline">
          Cancel
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={LABEL_CLS}>
          Company
          <input name="company" required defaultValue={job?.company ?? ""} className={INPUT_CLS} />
        </label>
        <label className={LABEL_CLS}>
          Title
          <input name="title" required defaultValue={job?.title ?? ""} className={INPUT_CLS} />
        </label>
        <label className={LABEL_CLS}>
          Role
          <CustomSelect
            name="role"
            defaultValue={job?.role ?? ROLE_OPTIONS[0]}
            options={ROLE_OPTIONS}
          />
        </label>
        <label className={LABEL_CLS}>
          Location
          <CustomSelect
            name="location"
            defaultValue={job?.location ?? LOCATION_OPTIONS[0]}
            options={LOCATION_OPTIONS}
          />
        </label>
        <label className={LABEL_CLS}>
          Salary
          <input name="salary" required defaultValue={job?.salary ?? ""} className={INPUT_CLS} />
        </label>
        <label className={LABEL_CLS}>
          Tags (comma-separated)
          <input name="tags" required placeholder="Frontend, AI, B2B" defaultValue={job?.tags?.join(", ") ?? ""} className={INPUT_CLS} />
        </label>
        <label className={LABEL_CLS}>
          Posted Date
          <input name="posted" required type="date" defaultValue={job?.posted ?? new Date().toISOString().slice(0, 10)} className={INPUT_CLS} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <span className={LABEL_CLS}>Company Logo</span>
          <div className="mt-1 flex items-center gap-3">
            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-full border border-[#ddd9cc] object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#b42318] text-xs text-white"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: job?.logo_color ?? "#FF6C0F" }}
              >
                {job?.logo_letter ?? "?"}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="text-sm text-[#4a4a40] file:mr-2 file:rounded-md file:border-0 file:bg-[#f0efe6] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#4a4a40] hover:file:bg-[#e5e4db]"
              />
              {uploading && <span className="text-xs text-[#FF6C0F]">Uploading...</span>}
              <span className="text-xs text-[#6b6b5e]">Optional. Falls back to color + letter if empty.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={LABEL_CLS}>
            Fallback Color
            <input type="color" name="logoColor" defaultValue={job?.logo_color ?? "#FF6C0F"} className="mt-1 h-10 w-full rounded-md border border-[#ddd9cc] bg-white px-1" />
          </label>
          <label className={LABEL_CLS}>
            Fallback Letter (1 char)
            <input name="logoLetter" required maxLength={1} defaultValue={job?.logo_letter ?? ""} className={`${INPUT_CLS} uppercase`} />
          </label>
        </div>
      </div>

      <label className={LABEL_CLS}>
        Description
        <textarea name="description" required rows={4} defaultValue={job?.description ?? ""} className="mt-1 w-full rounded-md border border-[#ddd9cc] px-3 py-2 text-sm outline-none focus:border-[#FF6C0F]" />
      </label>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-[#4a4a40]">
        <input type="checkbox" name="remote" defaultChecked={job?.remote ?? false} className="h-4 w-4 rounded border-[#ddd9cc]" />
        Remote Available
      </label>

      <div>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="rounded-md bg-[#FF6C0F] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Job"}
        </button>
      </div>
    </form>
  );
}

export default function JobsClient({ initialJobs }: JobsClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateJob = (formData: FormData) => {
    startTransition(() => {
      void (async () => {
        const result = await createJob(formData);

        if (!result.success) {
          window.alert(result.error ?? "Failed to create job.");
          return;
        }

        setShowForm(false);
      })();
    });
  };

  const handleUpdateJob = (formData: FormData) => {
    if (!editingJob) return;

    startTransition(() => {
      void (async () => {
        const result = await updateJob(editingJob.id, formData);

        if (!result.success) {
          window.alert(result.error ?? "Failed to update job.");
          return;
        }

        setEditingJob(null);
      })();
    });
  };

  const handleToggleActive = (jobId: string) => {
    startTransition(() => {
      void (async () => {
        const result = await toggleJobActive(jobId);

        if (!result.success) {
          window.alert(result.error ?? "Failed to toggle active state.");
          return;
        }

      })();
    });
  };

  const handleDelete = (jobId: string) => {
    const isConfirmed = window.confirm("Delete this job?");
    if (!isConfirmed) return;

    startTransition(() => {
      void (async () => {
        const result = await deleteJob(jobId);

        if (!result.success) {
          window.alert(result.error ?? "Failed to delete job.");
          return;
        }

      })();
    });
  };

  const handleEdit = (job: Job) => {
    setShowForm(false);
    setEditingJob(job);
  };

  const handleAdd = () => {
    setEditingJob(null);
    setShowForm((c) => !c);
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Jobs</h1>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-md bg-[#FF6C0F] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {showForm ? "Close" : "Add Job"}
          </button>
        </div>

        {showForm && (
          <JobForm isPending={isPending} onSubmit={handleCreateJob} onCancel={() => setShowForm(false)} />
        )}

        {editingJob && (
          <JobForm job={editingJob} isPending={isPending} onSubmit={handleUpdateJob} onCancel={() => setEditingJob(null)} />
        )}

        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold">Company</th>
                <th className="px-4 py-3 text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-sm font-semibold">Location</th>
                <th className="px-4 py-3 text-sm font-semibold">Active</th>
                <th className="px-4 py-3 text-sm font-semibold">Posted</th>
                <th className="px-4 py-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialJobs.map((job) => (
                <tr key={job.id} className={`border-t border-[#ece8db] ${editingJob?.id === job.id ? "bg-[#fff8f0]" : ""}`}>
                  <td className="px-4 py-3 text-sm font-semibold text-[#16140f]">{job.company}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{job.title}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{job.role}</td>
                  <td className="px-4 py-3 text-sm text-[#4a4a40]">{job.location}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(job.id)}
                      disabled={isPending}
                      className={`rounded-full px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                        job.active ? "bg-[#2f9e44]" : "bg-[#6b6b5e]"
                      }`}
                    >
                      {job.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b6b5e]">{formatDate(job.posted)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(job)}
                        disabled={isPending}
                        className="text-sm font-semibold text-[#FF6C0F] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(job.id)}
                        disabled={isPending}
                        className="text-sm font-semibold text-[#b42318] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
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
