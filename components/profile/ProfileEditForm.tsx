"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { updateProfile, updateEmail, updatePassword } from "@/lib/actions/profile";

const INPUT_CLASSNAME =
  "w-full border-0 border-b border-[#ccc] rounded-none bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-[#FF6C0F] focus:ring-0";

type ProfileEditFormProps = {
  currentEmail: string;
  currentUsername: string;
  currentFirstName: string;
  currentLastName: string;
  currentLinkedinUrl: string;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-['Pretendard',sans-serif] text-[18px] font-bold text-[#16140f]">
      {children}
    </h2>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return <p className="rounded bg-[#fff4e9] px-3 py-2 text-sm text-[#b64a00]">{message}</p>;
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="rounded bg-[#fdecec] px-3 py-2 text-sm text-[#b42318]">{message}</p>;
}

export default function ProfileEditForm({
  currentEmail,
  currentUsername,
  currentFirstName,
  currentLastName,
  currentLinkedinUrl,
}: ProfileEditFormProps) {
  const [username, setUsername] = useState(currentUsername);
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  const [linkedinUrl, setLinkedinUrl] = useState(currentLinkedinUrl);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profilePending, startProfileTransition] = useTransition();

  const [email, setEmail] = useState(currentEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailPending, startEmailTransition] = useTransition();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordPending, startPasswordTransition] = useTransition();

  const handleProfileSubmit = () => {
    setProfileError(null);
    setProfileSuccess(null);

    const formData = new FormData();
    formData.set("username", username);
    formData.set("first_name", firstName);
    formData.set("last_name", lastName);
    formData.set("linkedin_url", linkedinUrl);

    startProfileTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        setProfileError(result.error);
      } else {
        setProfileSuccess("프로필이 업데이트되었습니다.");
      }
    });
  };

  const handleEmailSubmit = () => {
    setEmailError(null);
    setEmailSuccess(null);

    const formData = new FormData();
    formData.set("email", email);

    startEmailTransition(async () => {
      const result = await updateEmail(formData);
      if (result.error) {
        setEmailError(result.error);
      } else {
        setEmailSuccess("확인 이메일이 발송되었습니다. 이메일을 확인해주세요.");
      }
    });
  };

  const handlePasswordSubmit = () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    const formData = new FormData();
    formData.set("new_password", newPassword);
    formData.set("confirm_password", confirmPassword);

    startPasswordTransition(async () => {
      const result = await updatePassword(formData);
      if (result.error) {
        setPasswordError(result.error);
      } else {
        setPasswordSuccess("비밀번호가 변경되었습니다.");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#d7d5ca] bg-[#fcfcf7] p-6 shadow-[0_14px_35px_rgba(22,20,15,0.05)] md:p-8">
        <SectionTitle>기본 정보</SectionTitle>

        <form action={handleProfileSubmit} className="mt-5 space-y-5">
          {profileError ? <ErrorMessage message={profileError} /> : null}
          {profileSuccess ? <SuccessMessage message={profileSuccess} /> : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="first_name" className="block text-sm font-medium text-[#666]">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                required
                className={INPUT_CLASSNAME}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="last_name" className="block text-sm font-medium text-[#666]">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                required
                className={INPUT_CLASSNAME}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium text-[#666]">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              className={INPUT_CLASSNAME}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="linkedin_url" className="block text-sm font-medium text-[#666]">
              LinkedIn URL <span className="font-normal text-[#999]">(Optional)</span>
            </label>
            <input
              id="linkedin_url"
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
            disabled={profilePending}
            className="w-full rounded bg-[#FF6C0F] px-6 py-3 font-semibold text-white transition-colors hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {profilePending ? "저장 중..." : "저장"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[#d7d5ca] bg-[#fcfcf7] p-6 shadow-[0_14px_35px_rgba(22,20,15,0.05)] md:p-8">
        <SectionTitle>이메일 변경</SectionTitle>

        <form action={handleEmailSubmit} className="mt-5 space-y-5">
          {emailError ? <ErrorMessage message={emailError} /> : null}
          {emailSuccess ? <SuccessMessage message={emailSuccess} /> : null}

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-[#666]">
              이메일
            </label>
            <input
              id="email"
              type="email"
              required
              className={INPUT_CLASSNAME}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={emailPending}
            className="w-full rounded bg-[#FF6C0F] px-6 py-3 font-semibold text-white transition-colors hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {emailPending ? "변경 중..." : "이메일 변경"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[#d7d5ca] bg-[#fcfcf7] p-6 shadow-[0_14px_35px_rgba(22,20,15,0.05)] md:p-8">
        <SectionTitle>비밀번호 변경</SectionTitle>

        <form action={handlePasswordSubmit} className="mt-5 space-y-5">
          {passwordError ? <ErrorMessage message={passwordError} /> : null}
          {passwordSuccess ? <SuccessMessage message={passwordSuccess} /> : null}

          <div className="space-y-1">
            <label htmlFor="new_password" className="block text-sm font-medium text-[#666]">
              새 비밀번호
            </label>
            <input
              id="new_password"
              type="password"
              required
              className={INPUT_CLASSNAME}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm_password" className="block text-sm font-medium text-[#666]">
              비밀번호 확인
            </label>
            <input
              id="confirm_password"
              type="password"
              required
              className={INPUT_CLASSNAME}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={passwordPending}
            className="w-full rounded bg-[#FF6C0F] px-6 py-3 font-semibold text-white transition-colors hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {passwordPending ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </section>

      <div className="text-center">
        <Link
          href="/profile"
          className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/60 underline underline-offset-4 hover:text-[#16140f]"
        >
          프로필로 돌아가기
        </Link>
      </div>
    </div>
  );
}
