"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signUp } from "@/lib/actions/auth";

const INPUT_CLASSNAME =
  "w-full border-0 border-b border-[#ccc] rounded-none bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-[#FF6C0F] focus:ring-0";

export default function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const handleSubmit = () => {
    setError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedLinkedinUrl = linkedinUrl.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedUsername || !trimmedPassword) {
      setError("Please fill out all fields.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    let normalizedLinkedInUrl = trimmedLinkedinUrl || "";
    if (trimmedLinkedinUrl) {
      if (!trimmedLinkedinUrl.startsWith("http://") && !trimmedLinkedinUrl.startsWith("https://")) {
        normalizedLinkedInUrl = "https://" + trimmedLinkedinUrl;
      }

      try {
        const parsedLinkedInUrl = new URL(normalizedLinkedInUrl);
        if (!parsedLinkedInUrl.hostname.includes("linkedin.com")) {
          setError("Please enter a valid LinkedIn profile URL.");
          return;
        }
      } catch {
        setError("Please enter a valid LinkedIn profile URL.");
        return;
      }
    }

    const formData = new FormData();
    formData.set("first_name", trimmedFirstName);
    formData.set("last_name", trimmedLastName);
    formData.set("email", trimmedEmail);
    formData.set("username", trimmedUsername);
    formData.set("password", trimmedPassword);
    formData.set("linkedin_url", normalizedLinkedInUrl);

    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/login?registered=true");
      }
    });
  };

  return (
    <form
      action={handleSubmit}
      className="space-y-5"
    >
      {error ? <p className="rounded bg-[#fdecec] px-3 py-2 text-sm text-[#b42318]">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="first_name" className="block text-sm font-medium text-[#666]">
            First Name
          </label>
          <input id="first_name" name="first_name" type="text" required className={INPUT_CLASSNAME} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label htmlFor="last_name" className="block text-sm font-medium text-[#666]">
            Last Name
          </label>
          <input id="last_name" name="last_name" type="text" required className={INPUT_CLASSNAME} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-[#666]">
          Email
        </label>
        <input id="email" name="email" type="email" required className={INPUT_CLASSNAME} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label htmlFor="username" className="block text-sm font-medium text-[#666]">
          Username
        </label>
        <input id="username" name="username" type="text" required className={INPUT_CLASSNAME} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-[#666]">
          Password
        </label>
        <input id="password" name="password" type="password" required className={INPUT_CLASSNAME} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label htmlFor="linkedin_url" className="block text-sm font-medium text-[#666]">
          Your LinkedIn Profile URL <span className="font-normal text-[#999]">(Optional)</span>
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          type="url"
          placeholder="https://www.linkedin.com/in/username/"
          className={INPUT_CLASSNAME}
          autoComplete="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-[#FF6C0F] px-6 py-3 font-semibold text-white transition-colors hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Signing up..." : "Sign Up"}
      </button>

      <p className="text-center text-sm text-[#555]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#FF6C0F] hover:underline">
          Log in.
        </Link>
      </p>
    </form>
  );
}
