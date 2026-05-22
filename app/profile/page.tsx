"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { AuthMessage } from "@/components/AuthMessage";
import { SubmitButton } from "@/components/SubmitButton";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";

type ExamSelection = {
  exam: string | null;
  selected_at: string | null;
};

const SUPPORT_EMAIL = "satyanarayanbaral12@gmail.com";

function getDisplayName(user: User | null) {
  const metadata = user?.user_metadata ?? {};
  const metadataName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : "";

  if (metadataName.trim()) {
    return metadataName.trim();
  }

  return user?.email?.split("@")[0] ?? "Student";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";
}

function getSingleLineEmailFontSize(email: string) {
  const emailLength = Math.max(email.trim().length, 1);
  const preferredContainerWidth = 100 / (emailLength * 0.7);

  return `clamp(0.52rem, ${preferredContainerWidth.toFixed(2)}cqw, 0.875rem)`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Recently selected";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const examFromUrl = useMemo(
    () => searchParams.get("exam")?.trim() ?? "",
    [searchParams],
  );
  const [user, setUser] = useState<User | null>(null);
  const [selectedExam, setSelectedExam] = useState(examFromUrl);
  const [selectedAt, setSelectedAt] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportProblem, setSupportProblem] = useState("");
  const [supportMessage, setSupportMessage] = useState("");

  const displayName = getDisplayName(user);
  const accountEmail = user?.email ?? "";
  const avatarUrl =
    photoPreview ||
    (typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "");
  const studyHref = selectedExam
    ? `/study?exam=${encodeURIComponent(selectedExam)}`
    : "/dashboard";
  const chatHref = selectedExam
    ? `/ai-doubt?exam=${encodeURIComponent(selectedExam)}`
    : "/ai-doubt";

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!isSupabaseConfigured) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setUser(data.session.user);

      if (!examFromUrl) {
        const { data: selection, error: selectionError } = await supabase
          .from("student_exam_selections")
          .select("exam, selected_at")
          .eq("user_id", data.session.user.id)
          .maybeSingle<ExamSelection>();

        if (!mounted) {
          return;
        }

        if (selectionError) {
          setError(selectionError.message);
        }

        if (selection?.exam) {
          setSelectedExam(selection.exam);
          setSelectedAt(selection.selected_at);
        }
      }

      setLoading(false);
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [examFromUrl, router]);

  useEffect(() => {
    setSelectedExam(examFromUrl);
  }, [examFromUrl]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setPhotoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return nextPreview;
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function handleOpenSupport() {
    setSupportName((currentName) => currentName || displayName);
    setSupportEmail((currentEmail) => currentEmail || accountEmail);
    setSupportMessage("");
    setSupportOpen(true);
  }

  function handleSupportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = supportName.trim();
    const email = supportEmail.trim();
    const problem = supportProblem.trim();

    if (!name || !email || !problem) {
      setSupportMessage("Please fill all support fields before submitting.");
      return;
    }

    const subject = `Crack AI support request from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Selected course: ${selectedExam || "Not selected"}`,
      "",
      "Problem:",
      problem,
    ].join("\n");

    setSupportMessage("Opening your email app with the support request.");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
          aria-label="Loading profile"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <style jsx>{`
        @keyframes profileRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes profileGlow {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.06);
          }
        }

        .profile-rise {
          animation: profileRise 720ms ease-out both;
        }

        .profile-glow {
          animation: profileGlow 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .profile-rise,
          .profile-glow {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(20,184,166,0.23),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.16),transparent_24%),linear-gradient(180deg,#020617,#07111f_44%,#020617)]" />
      <div className="pointer-events-none fixed inset-0 auth-grid opacity-45" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="profile-rise sticky top-4 z-20 rounded-2xl border border-white/10 bg-slate-950/72 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={studyHref} className="text-xl font-semibold tracking-normal">
              Crack AI
            </Link>

            <nav
              className="flex flex-wrap gap-2 text-sm font-semibold text-slate-300"
              aria-label="Profile navigation"
            >
              <Link
                href={studyHref}
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Exams
              </Link>
              <Link
                href={chatHref}
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Chat
              </Link>
            </nav>
          </div>
        </header>

        <section className="profile-rise grid flex-1 items-center gap-6 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:py-12">
          <aside className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/25 backdrop-blur-md">
            <div className="profile-glow absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${displayName} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-semibold text-teal-100">
                      {getInitials(displayName)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="absolute -bottom-3 left-1/2 inline-flex h-10 -translate-x-1/2 items-center justify-center rounded-full border border-teal-200/40 bg-teal-400 px-4 text-xs font-bold text-slate-950 shadow-xl shadow-teal-500/25 transition hover:-translate-y-0.5 hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/30"
                >
                  Edit photo
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <h1 className="mt-8 text-3xl font-semibold tracking-normal">
                {displayName}
              </h1>
              <p className="mt-2 max-w-full whitespace-nowrap text-sm text-slate-300">
                {accountEmail}
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100">
                <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(94,234,212,0.9)]" />
                Active student profile
              </div>
            </div>
          </aside>

          <div className="grid gap-5">
            {error ? <AuthMessage message={error} type="error" /> : null}

            <section className="profile-rise rounded-[1.75rem] border border-white/10 bg-slate-900/72 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">
                Course Details
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Chosen course
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-normal">
                    {selectedExam || "Not selected"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Selected on
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-normal">
                    {formatDate(selectedAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 [container-type:inline-size]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Account email
                  </p>
                  <p
                    className="mt-3 max-w-full whitespace-nowrap font-semibold leading-6 text-slate-200"
                    style={{ fontSize: getSingleLineEmailFontSize(accountEmail) }}
                  >
                    {accountEmail}
                  </p>
                </div>
              </div>
            </section>

            <section className="profile-rise grid gap-4 md:grid-cols-2">
              <Link
                href="/dashboard"
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/15 backdrop-blur-md transition hover:-translate-y-1 hover:border-teal-300/40"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                  Exams
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-normal">
                  Change chosen course
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Pick a different exam and refresh your study workspace.
                </p>
              </Link>

              <button
                type="button"
                onClick={handleOpenSupport}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 text-left shadow-xl shadow-black/15 backdrop-blur-md transition hover:-translate-y-1 hover:border-teal-300/40 focus:outline-none focus:ring-4 focus:ring-teal-300/20"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                  Support
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-normal">
                  Contact support
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Get help with your account, course, or AI study tools.
                </p>
              </button>
            </section>

            <section className="profile-rise flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-slate-900/72 p-5 shadow-2xl shadow-black/20 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Account actions
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Continue learning or securely leave this session.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={studyHref}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  Open dashboard
                </Link>
                <SubmitButton
                  type="button"
                  loading={signingOut}
                  onClick={handleSignOut}
                >
                  Logout
                </SubmitButton>
              </div>
            </section>
          </div>
        </section>
      </div>

      {supportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-4 py-6 backdrop-blur-sm">
          <div className="profile-rise w-full max-w-lg rounded-[1.5rem] border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-black/35">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                  Support request
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
                  Contact support
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl leading-none text-slate-300 transition hover:border-teal-300/50 hover:text-white focus:outline-none focus:ring-4 focus:ring-teal-300/20"
                aria-label="Close support form"
              >
                x
              </button>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleSupportSubmit}>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Name
                <input
                  type="text"
                  value={supportName}
                  onChange={(event) => setSupportName(event.target.value)}
                  required
                  className="h-12 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                  placeholder="Enter your name"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Email ID
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.target.value)}
                  required
                  className="h-12 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                  placeholder="Enter your email"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Your problem
                <textarea
                  value={supportProblem}
                  onChange={(event) => setSupportProblem(event.target.value)}
                  required
                  rows={5}
                  className="min-h-32 resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                  placeholder="Write the issue you are facing..."
                />
              </label>

              {supportMessage ? (
                <p className="rounded-xl border border-teal-300/25 bg-teal-300/10 px-4 py-3 text-sm font-medium text-teal-100">
                  {supportMessage}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-semibold text-slate-200 transition hover:border-teal-300/60 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-400 px-5 text-sm font-semibold text-slate-950 shadow-xl shadow-teal-500/20 transition hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/25"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
            aria-label="Loading profile"
          />
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
