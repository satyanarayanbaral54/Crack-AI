"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AiVoiceTutor } from "@/components/AiVoiceTutor";
import { getChatHistory, type ChatHistoryRecord } from "@/lib/chatHistory";
import { trackDailyPresence, trackEngagementEvent } from "@/lib/engagement";
import { getExamContent } from "@/lib/examContent";
import {
  getMockTestConfig,
  type MockQuestion,
} from "@/lib/mockTest";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";

const crackAiDashboardDetails = {
  name: "Crack AI",
  dashboardSummary:
    "Crack AI is your focused preparation workspace for competitive exams. Choose an exam first so the chatbot, syllabus map, resources, quizzes, and revision guidance can match the exact journey you are preparing for.",
  focusAreas: ["Choose exam first", "Personalized AI help", "Focused revision"],
};

const dashboardVoiceTutorSteps = [
  "Use AI Chat to ask doubts and create quizzes.",
  "Open Syllabus to follow exam topics clearly.",
  "Check Growth to see progress and streaks.",
  "Use Mock Test and History for practice review.",
];

function formatHistoryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMockTime(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getMockDurationLabel(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

function formatMarks(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function calculateMockResult(
  questions: MockQuestion[],
  answers: Record<string, number>,
) {
  return questions.reduce(
    (result, question) => {
      const selectedAnswer = answers[question.id];

      result.totalMarks += question.marks;

      if (selectedAnswer === undefined) {
        result.unanswered += 1;
        return result;
      }

      result.attempted += 1;

      if (selectedAnswer === question.correctAnswerIndex) {
        result.correct += 1;
        result.score += question.marks;
        return result;
      }

      result.incorrect += 1;
      result.score -= question.negativeMarks;
      return result;
    },
    {
      attempted: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      score: 0,
      totalMarks: 0,
    },
  );
}

function getMockSuggestions({
  questions,
  answers,
}: {
  questions: MockQuestion[];
  answers: Record<string, number>;
}) {
  const result = calculateMockResult(questions, answers);
  const percentage =
    result.totalMarks > 0 ? (Math.max(result.score, 0) / result.totalMarks) * 100 : 0;
  const sectionStats = new Map<
    string,
    { total: number; correct: number; attempted: number }
  >();

  questions.forEach((question) => {
    const stats = sectionStats.get(question.section) ?? {
      total: 0,
      correct: 0,
      attempted: 0,
    };
    const selectedAnswer = answers[question.id];

    stats.total += 1;

    if (selectedAnswer !== undefined) {
      stats.attempted += 1;
    }

    if (selectedAnswer === question.correctAnswerIndex) {
      stats.correct += 1;
    }

    sectionStats.set(question.section, stats);
  });

  const weakestSection =
    Array.from(sectionStats.entries()).sort((first, second) => {
      const firstAccuracy = first[1].total ? first[1].correct / first[1].total : 0;
      const secondAccuracy = second[1].total ? second[1].correct / second[1].total : 0;
      return firstAccuracy - secondAccuracy;
    })[0]?.[0] ?? "core concepts";

  if (percentage >= 80) {
    return [
      "Your accuracy is strong. Move to mixed-topic timed sets and reduce average solving time.",
      `Keep ${weakestSection} in revision rotation so it does not become a hidden weak area.`,
      "Review wrong options even when you score well; top ranks are protected by error analysis.",
    ];
  }

  if (result.incorrect > result.correct) {
    return [
      "Your negative marks are hurting the score. Attempt fewer low-confidence questions in the next mock.",
      `Rebuild ${weakestSection} with concept notes, then solve 15 targeted MCQs before the next full timer.`,
      "Write down why each wrong option looked attractive; that pattern usually reveals the real gap.",
    ];
  }

  if (result.unanswered >= Math.ceil(questions.length * 0.3)) {
    return [
      "Your accuracy can improve, but speed is the first bottleneck. Use two-pass solving in the next mock.",
      `Practice quick question selection in ${weakestSection}; skip faster when the setup feels long.`,
      "Set mini timers of 8-10 minutes for small question groups to build exam rhythm.",
    ];
  }

  return [
    "You are in the middle band. Keep attempting mocks, but analyze every wrong and guessed question.",
    `Give extra revision time to ${weakestSection} before starting the next mock.`,
    "Pair one AI doubt session with one mock review session so mistakes turn into fixed concepts.",
  ];
}

function StudyDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedExam = useMemo(
    () => searchParams.get("exam")?.trim() ?? "",
    [searchParams],
  );
  const examDetails = useMemo(() => getExamContent(selectedExam), [selectedExam]);
  const hasSelectedExam = Boolean(selectedExam && examDetails);
  const dashboardDetails = examDetails ?? crackAiDashboardDetails;
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<ChatHistoryRecord[]>([]);
  const [mockRulesOpen, setMockRulesOpen] = useState(false);
  const [mockTestOpen, setMockTestOpen] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState("");
  const [mockWarning, setMockWarning] = useState("");
  const [mockQuestions, setMockQuestions] = useState<MockQuestion[]>([]);
  const [mockAnswers, setMockAnswers] = useState<Record<string, number>>({});
  const [mockCurrentIndex, setMockCurrentIndex] = useState(0);
  const [mockTimeLeft, setMockTimeLeft] = useState(0);
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [mockReviewOpen, setMockReviewOpen] = useState(false);
  const [mockSuggestionOpen, setMockSuggestionOpen] = useState(false);
  const [mockSubmitReason, setMockSubmitReason] = useState<"manual" | "time">(
    "manual",
  );

  const chatHref = hasSelectedExam
    ? `/ai-doubt?exam=${encodeURIComponent(selectedExam)}`
    : "/dashboard";
  const syllabusHref = hasSelectedExam
    ? `/syllabus?exam=${encodeURIComponent(selectedExam)}`
    : "/dashboard";
  const profileHref = selectedExam
    ? `/profile?exam=${encodeURIComponent(selectedExam)}`
    : "/profile";
  const growthHref = selectedExam
    ? `/growth?exam=${encodeURIComponent(selectedExam)}`
    : "/growth";
  const mockConfig = selectedExam ? getMockTestConfig(selectedExam) : null;
  const mockDurationLabel = mockConfig
    ? getMockDurationLabel(mockConfig.mockDurationMinutes)
    : "--";
  const officialDurationLabel = mockConfig
    ? getMockDurationLabel(mockConfig.durationMinutes)
    : "--";
  const currentMockQuestion = mockQuestions[mockCurrentIndex];
  const mockResult = calculateMockResult(mockQuestions, mockAnswers);
  const mockPercentage =
    mockResult.totalMarks > 0
      ? Math.max(mockResult.score, 0) / mockResult.totalMarks
      : 0;
  const mockSuggestions = getMockSuggestions({
    questions: mockQuestions,
    answers: mockAnswers,
  });
  const dashboardVoiceTutorScript = hasSelectedExam
    ? `Welcome to your ${dashboardDetails.name} dashboard in Crack AI. Use Open AI Chat to ask doubts and generate quick quizzes. Use Syllabus to understand what to cover next. The Growth page shows daily progress, streaks, and monthly suggestions. AI History stores your previous doubt sessions. The Mock Test section lets you practice exam-style MCQs with a timer, result analysis, answer checking, and improvement suggestions. If you want to change your exam, use the Exams option in the navigation.`
    : "Welcome to Crack AI dashboard. First choose your target exam from the Exams page. After that, this dashboard will unlock AI doubts, syllabus guidance, growth tracking, mock tests, saved history, and profile options for your preparation.";

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
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

      if (selectedExam && !examDetails) {
        router.replace("/dashboard");
        return;
      }

      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [examDetails, router, selectedExam]);

  useEffect(() => {
    if (!selectedExam) {
      setHistoryItems([]);
      return;
    }

    function loadHistory() {
      setHistoryItems(getChatHistory());
    }

    loadHistory();
    window.addEventListener("focus", loadHistory);
    window.addEventListener("storage", loadHistory);

    return () => {
      window.removeEventListener("focus", loadHistory);
      window.removeEventListener("storage", loadHistory);
    };
  }, [selectedExam]);

  useEffect(() => {
    if (loading) {
      return;
    }

    trackDailyPresence({
      exam: selectedExam || dashboardDetails.name,
      area: "study",
    });
  }, [dashboardDetails.name, loading, selectedExam]);

  useEffect(() => {
    if (!mockTestOpen || mockSubmitted || mockQuestions.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setMockTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(timer);
          setMockSubmitted(true);
          setMockSubmitReason("time");
          setMockSuggestionOpen(true);
          trackEngagementEvent({
            type: "quiz",
            exam: selectedExam,
            metadata: {
              kind: "mock-test",
              submittedBy: "timer",
              questionCount: mockQuestions.length,
            },
          });
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mockQuestions.length, mockSubmitted, mockTestOpen, selectedExam]);

  function openChat() {
    router.push(hasSelectedExam ? chatHref : "/dashboard");
  }

  function handleOpenMockRules() {
    if (!hasSelectedExam) {
      router.push("/dashboard");
      return;
    }

    setMockError("");
    setMockWarning("");
    setMockRulesOpen(true);
  }

  async function handleBeginMockTest() {
    if (!mockConfig) {
      router.push("/dashboard");
      return;
    }

    setMockLoading(true);
    setMockError("");
    setMockWarning("");

    try {
      const response = await fetch("/api/mock-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exam: selectedExam }),
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data.questions)) {
        setMockError(data.error ?? "Could not prepare the mock test.");
        return;
      }

      setMockQuestions(data.questions as MockQuestion[]);
      setMockAnswers({});
      setMockCurrentIndex(0);
      setMockTimeLeft(mockConfig.mockDurationMinutes * 60);
      setMockSubmitted(false);
      setMockReviewOpen(false);
      setMockSuggestionOpen(false);
      setMockSubmitReason("manual");
      setMockWarning(typeof data.warning === "string" ? data.warning : "");
      setMockRulesOpen(false);
      setMockTestOpen(true);
    } catch {
      setMockError("Could not reach the mock test route. Please try again.");
    } finally {
      setMockLoading(false);
    }
  }

  function handleMockAnswer(questionId: string, optionIndex: number) {
    if (mockSubmitted) {
      return;
    }

    setMockAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: optionIndex,
    }));
  }

  function handleSubmitMockTest(reason: "manual" | "time" = "manual") {
    if (mockSubmitted) {
      return;
    }

    setMockSubmitted(true);
    setMockSubmitReason(reason);
    setMockSuggestionOpen(true);
    trackEngagementEvent({
      type: "quiz",
      exam: selectedExam,
      metadata: {
        kind: "mock-test",
        submittedBy: reason,
        questionCount: mockQuestions.length,
        attempted: mockResult.attempted,
        correct: mockResult.correct,
        score: Number(mockResult.score.toFixed(2)),
      },
    });
  }

  function handleRetakeMockTest() {
    setMockTestOpen(false);
    setMockQuestions([]);
    setMockAnswers({});
    setMockCurrentIndex(0);
    setMockTimeLeft(0);
    setMockSubmitted(false);
    setMockReviewOpen(false);
    setMockSuggestionOpen(false);
    setMockRulesOpen(true);
  }

  if (loading || (selectedExam && !examDetails)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
          aria-label="Loading study dashboard"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <style jsx>{`
        @keyframes dashboardRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orbitSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes reverseOrbitSpin {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }

        @keyframes floatCore {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes historyReveal {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes historyLineGlow {
          0%,
          100% {
            opacity: 0.42;
          }
          50% {
            opacity: 0.9;
          }
        }

        @keyframes mockPanelIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes mockTimerPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(251, 191, 36, 0);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.22);
          }
        }

        .dashboard-rise {
          animation: dashboardRise 760ms ease-out both;
        }

        .orbit-primary {
          animation: orbitSpin 12s linear infinite;
        }

        .orbit-secondary {
          animation: reverseOrbitSpin 16s linear infinite;
        }

        .pulse-glow {
          animation: pulseGlow 3.8s ease-in-out infinite;
        }

        .float-core {
          animation: floatCore 4.2s ease-in-out infinite;
        }

        .history-reveal {
          animation: historyReveal 640ms ease-out both;
        }

        .history-line-glow {
          animation: historyLineGlow 2.8s ease-in-out infinite;
        }

        .mock-panel-in {
          animation: mockPanelIn 540ms ease-out both;
        }

        .mock-timer-pulse {
          animation: mockTimerPulse 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-rise,
          .orbit-primary,
          .orbit-secondary,
          .pulse-glow,
          .float-core,
          .history-reveal,
          .history-line-glow,
          .mock-panel-in,
          .mock-timer-pulse {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(20,184,166,0.22),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(249,115,22,0.1),transparent_24%),linear-gradient(180deg,#020617,#07111f_46%,#020617)]" />
      <div className="pointer-events-none fixed inset-0 auth-grid opacity-45" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="dashboard-rise sticky top-2 z-20 rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:top-4 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="#home"
              className="text-lg font-semibold tracking-normal text-white sm:text-xl"
            >
              Crack AI
            </Link>

            <nav
              className="flex w-full gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-300 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0"
              aria-label="Study dashboard"
            >
              <a
                href="#home"
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Home
              </a>
              <Link
                href={growthHref}
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Growth
              </Link>
              <Link
                href={profileHref}
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Profile
              </Link>
              <Link
                href="/dashboard"
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Exams
              </Link>
            </nav>
          </div>
        </header>

        <section
          id="home"
          className="dashboard-rise grid flex-1 items-center gap-8 py-8 sm:py-14 lg:grid-cols-[0.96fr_1.04fr] lg:py-16"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300 sm:text-sm sm:tracking-[0.3em]">
              {hasSelectedExam
                ? `${dashboardDetails.name} learning dashboard`
                : "Crack AI learning dashboard"}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-white sm:mt-5 sm:text-5xl lg:text-6xl">
              {hasSelectedExam
                ? "Practice smarter with an AI study companion built for focus."
                : "Choose your exam first, then study with sharper AI guidance."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-6 sm:text-base sm:leading-8">
              {hasSelectedExam
                ? "Ask doubts, revise concepts, generate quizzes, and keep your exam preparation moving from one clean workspace."
                : "Crack AI helps students ask doubts, revise concepts, build quizzes, and follow a cleaner preparation path. Select an exam so every answer, resource, and syllabus action becomes relevant to your goal."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={chatHref}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-500 px-6 text-sm font-semibold text-slate-950 shadow-xl shadow-teal-500/20 transition hover:-translate-y-0.5 hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-300/30"
              >
                {hasSelectedExam ? "Open AI Chat" : "Choose Exam First"}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/12 px-6 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-teal-300/70 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10"
              >
                {hasSelectedExam ? "Change Exam" : "View Exams"}
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={openChat}
            className="group relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/35 outline-none backdrop-blur-md transition hover:-translate-y-1 hover:border-teal-300/50 focus:ring-4 focus:ring-teal-400/25 sm:rounded-[2rem] sm:p-8"
            aria-label="Open AI chatbot"
          >
            <div className="pulse-glow absolute h-[62%] w-[62%] rounded-full bg-teal-300/20 blur-3xl" />
            <div className="orbit-primary absolute h-[82%] w-[82%] rounded-full border border-dashed border-teal-200/26">
              <span className="absolute left-1/2 top-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-teal-200 shadow-[0_0_24px_rgba(94,234,212,0.9)]" />
              <span className="absolute bottom-8 right-3 h-2.5 w-2.5 rounded-full bg-orange-300 shadow-[0_0_20px_rgba(253,186,116,0.8)]" />
            </div>
            <div className="orbit-secondary absolute h-[62%] w-[62%] rounded-full border border-white/12">
              <span className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_20px_rgba(165,243,252,0.8)]" />
            </div>
            <div className="float-core relative flex h-36 w-36 items-center justify-center rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:h-56 sm:w-56 sm:rounded-[2rem] sm:p-6">
              <img
                src="/crack-ai-logo.png"
                alt="Crack AI logo"
                className="max-h-full max-w-full object-contain drop-shadow-[0_0_36px_rgba(45,212,191,0.42)]"
              />
            </div>
            <span className="absolute bottom-4 max-w-[86%] rounded-full border border-teal-300/30 bg-slate-950/80 px-3 py-2 text-center text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-teal-200 transition group-hover:border-teal-200 group-hover:text-white sm:bottom-6 sm:px-4 sm:text-xs sm:tracking-[0.2em]">
              {hasSelectedExam ? "Click to ask AI" : "Choose exam first"}
            </span>
          </button>
        </section>

        <section
          id="growth"
          className="dashboard-rise grid gap-4 pb-8 md:grid-cols-3"
        >
          {[
            {
              label: "Doubt Support",
              title: "Doubt solving",
              description: "Ask concept questions and receive structured answers.",
            },
            {
              label: "Practice",
              title: "Smart quizzes",
              description: "Turn any topic into quick practice tests.",
            },
            {
              label: "Resources",
              title: "Resource path",
              description: "Get videos, PDFs, and topics after every answer.",
            },
          ].map(({ label, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/15 backdrop-blur-md transition hover:-translate-y-1 hover:border-teal-300/40"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                {label}
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-white">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {description}
              </p>
            </article>
          ))}
        </section>

        <section
          id="profile"
          className="dashboard-rise mb-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5 lg:grid-cols-[1fr_0.7fr]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
              {hasSelectedExam ? "Exam Focus" : "Before You Begin"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
              {hasSelectedExam
                ? `Ready for ${dashboardDetails.name}`
                : "Welcome to Crack AI"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {dashboardDetails.dashboardSummary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {dashboardDetails.focusAreas.map((focusArea) => (
                <span
                  key={focusArea}
                  className="rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100"
                >
                  {focusArea}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href={chatHref}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              {hasSelectedExam ? "Continue to Chatbot" : "Choose Exam First"}
            </Link>
            <Link
              href={syllabusHref}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-500 px-5 text-sm font-semibold text-slate-950 shadow-xl shadow-teal-500/20 transition hover:-translate-y-0.5 hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-300/25"
            >
              {hasSelectedExam ? "Syllabus" : "Browse Exam Options"}
            </Link>
          </div>
        </section>

        <section className="dashboard-rise mb-10 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                AI History
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
                Saved doubt sessions
              </h2>
            </div>
            <span className="w-fit rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
              {historyItems.length} saved
            </span>
          </div>

          {historyItems.length > 0 ? (
            <div className="mt-5 grid max-h-[28rem] gap-3 overflow-y-auto pr-1">
              {historyItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/ai-doubt?exam=${encodeURIComponent(
                    item.exam,
                  )}&history=${encodeURIComponent(item.id)}`}
                  className="history-reveal group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/58 p-4 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-cyan-300/45 hover:bg-slate-900/80 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                  style={{
                    animationDelay: `${Math.min(index * 70, 490)}ms`,
                  }}
                >
                  <span className="history-line-glow absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-teal-300 via-cyan-300 to-amber-300" />
                  <div className="flex flex-col gap-3 pl-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
                        {item.exam} question
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 tracking-normal text-white">
                        {item.question}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {item.answer.summary}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300 transition group-hover:border-cyan-300/30 group-hover:text-cyan-100">
                      {formatHistoryDate(item.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-slate-950/40 p-5">
              <p className="text-sm font-semibold text-slate-200">
                No AI history yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {hasSelectedExam
                  ? "Completed AI answers will appear here."
                  : "Choose an exam first, then your completed AI answers will appear here."}
              </p>
            </div>
          )}
        </section>

        <section className="dashboard-rise mb-10 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/72 p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.78fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Mock Test
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
                {mockConfig
                  ? mockConfig.title
                  : "Choose an exam to unlock mock tests"}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                {mockConfig
                  ? `${mockConfig.formatSummary} Start a high-level MCQ mock with timer, automatic submission, answer analysis, and improvement suggestions.`
                  : "Select your target exam first so Crack AI can prepare the right mock format and scoring style."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/42 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Mock duration
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {mockDurationLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/42 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Mock set
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {mockConfig ? `${mockConfig.mockQuestionCount} MCQs` : "--"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/42 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Marking
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white">
                    {mockConfig?.markingSummary ?? "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
              <div className="relative">
                <p className="text-sm font-semibold text-amber-100">
                  Exam simulator
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Rules appear first. The timer is scaled for this mock set and
                  starts only after you begin the test.
                </p>
                <button
                  type="button"
                  onClick={handleOpenMockRules}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-amber-300 px-5 text-sm font-semibold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/25"
                >
                  {hasSelectedExam ? "Start Exam" : "Choose Exam First"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {mockRulesOpen && mockConfig ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6">
          <section className="mock-panel-in max-h-[calc(100svh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-black/40 sm:rounded-[1.5rem] sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Rules and regulations
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
                  {mockConfig.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMockRulesOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl leading-none text-slate-300 transition hover:border-amber-300/50 hover:text-white focus:outline-none focus:ring-4 focus:ring-amber-300/20"
                aria-label="Close mock rules"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/58 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Mock time
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {mockDurationLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/58 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Official exam
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {officialDurationLabel}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {mockConfig.officialQuestionCount} questions
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/58 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Official marks
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {mockConfig.officialTotalMarks}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-sm font-semibold text-white">Exam rules</p>
              <ul className="mt-3 grid gap-3">
                {[
                  `This ${mockConfig.mockQuestionCount}-question mock uses a fair scaled timer of ${mockDurationLabel}, based on exam pace and question difficulty.`,
                  ...mockConfig.instructions,
                ].map((instruction) => (
                  <li
                    key={instruction}
                    className="flex gap-3 rounded-xl border border-white/8 bg-slate-950/38 px-4 py-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>

            {mockError ? (
              <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm font-medium text-rose-100">
                {mockError}
              </p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMockRulesOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-semibold text-slate-200 transition hover:border-amber-300/50 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBeginMockTest}
                disabled={mockLoading}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-300 px-5 text-sm font-semibold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {mockLoading ? "Preparing test..." : "Begin Test"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {mockTestOpen && mockConfig ? (
        <div className="fixed inset-0 z-50 bg-slate-950/92 px-2 py-2 backdrop-blur-md sm:px-6 sm:py-6">
          <section className="mock-panel-in mx-auto flex h-full max-w-7xl flex-col overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/45 lg:overflow-hidden lg:rounded-[1.5rem]">
            <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Live mock test
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-normal text-white sm:text-2xl">
                  {mockConfig.title}
                </h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="mock-timer-pulse inline-flex h-11 w-full items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 text-sm font-bold text-amber-100 sm:w-auto">
                  {formatMockTime(mockTimeLeft)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    mockSubmitted
                      ? setMockTestOpen(false)
                      : handleSubmitMockTest("manual")
                  }
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-white/20 sm:w-auto"
                >
                  {mockSubmitted ? "Close" : "Submit Test"}
                </button>
              </div>
            </header>

            {mockSubmitted ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                  <aside className="rounded-[1.5rem] border border-white/10 bg-slate-950/58 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                      Result analysis
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                      {formatMarks(mockResult.score)}
                      <span className="text-lg text-slate-400">
                        /{formatMarks(mockResult.totalMarks)}
                      </span>
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {mockSubmitReason === "time"
                        ? "Time ended, so Crack AI submitted the test automatically."
                        : "Your mock test has been submitted successfully."}
                    </p>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-300 via-amber-300 to-teal-300 transition-all"
                        style={{ width: `${Math.min(mockPercentage * 100, 100)}%` }}
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      {[
                        ["Attempted", mockResult.attempted],
                        ["Correct", mockResult.correct],
                        ["Wrong", mockResult.incorrect],
                        ["Skipped", mockResult.unanswered],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-white/10 bg-white/[0.045] p-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {label}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3">
                      <button
                        type="button"
                        onClick={() => setMockReviewOpen((isOpen) => !isOpen)}
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/25"
                      >
                        {mockReviewOpen ? "Hide Check Answers" : "Check Answers"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMockSuggestionOpen(true)}
                        className="inline-flex h-12 items-center justify-center rounded-xl border border-amber-300/30 px-5 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:text-white focus:outline-none focus:ring-4 focus:ring-amber-300/15"
                      >
                        View Suggestion
                      </button>
                      <button
                        type="button"
                        onClick={handleRetakeMockTest}
                        className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10"
                      >
                        Retake Mock
                      </button>
                    </div>
                  </aside>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                      AI answer review
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      {mockReviewOpen
                        ? "Correct and wrong options"
                        : "Open check answers to see the full review"}
                    </h3>

                    {mockReviewOpen ? (
                      <div className="mt-5 grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
                        {mockQuestions.map((question, index) => {
                          const selectedAnswer = mockAnswers[question.id];
                          const isCorrect =
                            selectedAnswer === question.correctAnswerIndex;

                          return (
                            <article
                              key={question.id}
                              className="rounded-2xl border border-white/10 bg-slate-950/58 p-4"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
                                  Q{index + 1} · {question.section}
                                </p>
                                <span
                                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                    selectedAnswer === undefined
                                      ? "bg-slate-700 text-slate-200"
                                      : isCorrect
                                        ? "bg-emerald-300/15 text-emerald-100"
                                        : "bg-rose-300/15 text-rose-100"
                                  }`}
                                >
                                  {selectedAnswer === undefined
                                    ? "Skipped"
                                    : isCorrect
                                      ? "Right"
                                      : "Wrong"}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-semibold leading-6 text-white">
                                {question.question}
                              </p>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {question.options.map((option, optionIndex) => {
                                  const optionIsCorrect =
                                    optionIndex === question.correctAnswerIndex;
                                  const optionIsSelected =
                                    optionIndex === selectedAnswer;
                                  const optionClass = optionIsCorrect
                                    ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-100"
                                    : optionIsSelected
                                      ? "border-rose-300/60 bg-rose-300/10 text-rose-100"
                                      : "border-white/10 bg-white/[0.035] text-slate-300";

                                  return (
                                    <div
                                      key={`${option}-${optionIndex}`}
                                      className={`rounded-xl border px-3 py-2 text-sm leading-6 ${optionClass}`}
                                    >
                                      <span className="mr-2 font-bold">
                                        {String.fromCharCode(65 + optionIndex)}.
                                      </span>
                                      {option}
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-300">
                                {question.explanation}
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-slate-950/40 p-5">
                        <p className="text-sm leading-6 text-slate-300">
                          Use the check option to compare your selected answer
                          with the correct option and explanation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid flex-1 gap-0 overflow-y-auto lg:min-h-0 lg:grid-cols-[1fr_19rem] lg:overflow-hidden">
                <div className="p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
                  {mockWarning ? (
                    <p className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100">
                      {mockWarning}
                    </p>
                  ) : null}

                  {currentMockQuestion ? (
                    <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:rounded-[1.5rem] sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                            Question {mockCurrentIndex + 1} of{" "}
                            {mockQuestions.length}
                          </p>
                          <h3 className="mt-3 text-xl font-semibold leading-7 text-white sm:text-2xl sm:leading-8">
                            {currentMockQuestion.question}
                          </h3>
                        </div>
                        <span className="w-fit rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                          {currentMockQuestion.section}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3">
                        {currentMockQuestion.options.map((option, optionIndex) => {
                          const isSelected =
                            mockAnswers[currentMockQuestion.id] === optionIndex;

                          return (
                            <button
                              key={`${option}-${optionIndex}`}
                              type="button"
                              onClick={() =>
                                handleMockAnswer(currentMockQuestion.id, optionIndex)
                              }
                              className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-medium leading-6 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-teal-300/20 ${
                                isSelected
                                  ? "border-teal-300/70 bg-teal-300/15 text-teal-50"
                                  : "border-white/10 bg-slate-950/52 text-slate-200 hover:border-teal-300/35 hover:bg-slate-900"
                              }`}
                            >
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setMockCurrentIndex((currentIndex) =>
                              Math.max(currentIndex - 1, 0),
                            )
                          }
                          disabled={mockCurrentIndex === 0}
                          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMockCurrentIndex((currentIndex) =>
                              Math.min(currentIndex + 1, mockQuestions.length - 1),
                            )
                          }
                          disabled={mockCurrentIndex === mockQuestions.length - 1}
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next Question
                        </button>
                      </div>
                    </article>
                  ) : null}
                </div>

                <aside className="border-t border-white/10 bg-slate-950/52 p-4 lg:border-l lg:border-t-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Question palette
                  </p>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {mockQuestions.map((question, index) => {
                      const answered = mockAnswers[question.id] !== undefined;

                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => setMockCurrentIndex(index)}
                          className={`h-11 rounded-xl border text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-teal-300/20 ${
                            index === mockCurrentIndex
                              ? "border-teal-300 bg-teal-300 text-slate-950"
                              : answered
                                ? "border-emerald-300/40 bg-emerald-300/12 text-emerald-100"
                                : "border-white/10 bg-white/[0.045] text-slate-300"
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2">
                      <span>Answered</span>
                      <span className="font-semibold text-white">
                        {mockResult.attempted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2">
                      <span>Remaining</span>
                      <span className="font-semibold text-white">
                        {mockQuestions.length - mockResult.attempted}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubmitMockTest("manual")}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-amber-300 px-5 text-sm font-semibold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/25"
                  >
                    Final Submit
                  </button>
                </aside>
              </div>
            )}
          </section>

          {mockSubmitted && mockSuggestionOpen ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/55 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6">
              <section className="mock-panel-in max-h-[calc(100svh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-teal-300/20 bg-slate-900 p-4 shadow-2xl shadow-black/40 sm:rounded-[1.5rem] sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                  AI suggestion
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  What to improve next
                </h3>
                <div className="mt-5 grid gap-3">
                  {mockSuggestions.map((suggestion) => (
                    <p
                      key={suggestion}
                      className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-slate-300"
                    >
                      {suggestion}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMockSuggestionOpen(false)}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/25"
                >
                  Continue Review
                </button>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}

      {!mockTestOpen ? (
        <AiVoiceTutor
          exam={hasSelectedExam ? selectedExam : ""}
          heading="Need help with this dashboard?"
          script={dashboardVoiceTutorScript}
          steps={dashboardVoiceTutorSteps}
        />
      ) : null}
    </main>
  );
}

export default function StudyDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
            aria-label="Loading study dashboard"
          />
        </main>
      }
    >
      <StudyDashboardContent />
    </Suspense>
  );
}
