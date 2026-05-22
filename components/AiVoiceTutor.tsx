"use client";

import { useEffect, useRef, useState } from "react";
import {
  saveChatHistoryRecord,
  type DoubtAnswer,
} from "@/lib/chatHistory";

type AiVoiceTutorProps = {
  script: string;
  steps: string[];
  heading?: string;
  exam?: string;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultListLike;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

export function AiVoiceTutor({
  script,
  steps,
  heading = "Need help using Crack AI?",
  exam = "",
}: AiVoiceTutorProps) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [voiceQuestion, setVoiceQuestion] = useState("");
  const [voiceAnswer, setVoiceAnswer] = useState("");

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopTutor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  }

  function speakText(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setNotice(
        "Voice tutor is not supported in this browser. You can still read the guide here.",
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (voice) =>
          voice.lang.toLowerCase().startsWith("en") &&
          /google|microsoft|india|female/i.test(voice.name),
      ) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));

    utterance.rate = 0.92;
    utterance.pitch = 1.03;
    utterance.volume = 1;
    utterance.voice = preferredVoice ?? null;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setNotice("Voice playback stopped. Tap Play Guide to try again.");
    };

    window.speechSynthesis.speak(utterance);
  }

  function playTutor() {
    setOpen(true);
    setNotice("");
    speakText(script);
  }

  function handleTutorButtonClick() {
    if (speaking) {
      stopTutor();
      return;
    }

    playTutor();
  }

  function closeTutor() {
    stopTutor();
    setOpen(false);
  }

  function getSpeechRecognition() {
    if (typeof window === "undefined") {
      return null;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const RecognitionConstructor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    return RecognitionConstructor ? new RecognitionConstructor() : null;
  }

  async function answerVoiceDoubt(question: string) {
    const normalizedQuestion = question.trim();
    const normalizedExam = exam.trim();

    if (!normalizedExam) {
      setNotice("Choose an exam first, then ask your doubt by voice.");
      return;
    }

    if (!normalizedQuestion) {
      setNotice("I could not hear a clear question. Tap the mic and try again.");
      return;
    }

    setAnswerLoading(true);
    setNotice("");
    setVoiceQuestion(normalizedQuestion);
    setVoiceAnswer("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: normalizedQuestion,
          exam: normalizedExam,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setNotice(data.error ?? "AI could not answer this voice doubt.");
        return;
      }

      const answer = data as DoubtAnswer;
      const spokenAnswer = [
        answer.summary,
        answer.explanation,
        answer.keyConcepts.length > 0
          ? `Key concepts: ${answer.keyConcepts.slice(0, 4).join(", ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      saveChatHistoryRecord({
        exam: normalizedExam,
        question: normalizedQuestion,
        answer,
      });
      window.dispatchEvent(new Event("storage"));
      setVoiceAnswer(answer.summary || answer.explanation);
      speakText(`Here is your ${normalizedExam} answer. ${spokenAnswer}`);
    } catch {
      setNotice("Could not reach the AI tutor. Please try again.");
    } finally {
      setAnswerLoading(false);
    }
  }

  function handleMicClick() {
    setOpen(true);
    setNotice("");
    setVoiceAnswer("");
    stopTutor();

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = getSpeechRecognition();

    if (!recognition) {
      setNotice(
        "Voice input is not supported in this browser. Try Chrome or Edge for mic doubts.",
      );
      return;
    }

    let capturedQuestion = "";
    let submitted = false;

    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onstart = () => {
      setListening(true);
      setVoiceQuestion("Listening...");
    };
    recognition.onerror = (event) => {
      setListening(false);
      setNotice(
        event.error === "not-allowed"
          ? "Microphone permission was blocked. Allow mic access to ask by voice."
          : "I could not hear clearly. Tap the mic and try again.",
      );
    };
    recognition.onresult = (event) => {
      let interimQuestion = "";
      let finalQuestion = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalQuestion += transcript;
        } else {
          interimQuestion += transcript;
        }
      }

      capturedQuestion = (finalQuestion || interimQuestion).trim();
      setVoiceQuestion(capturedQuestion || "Listening...");

      if (finalQuestion.trim() && !submitted) {
        submitted = true;
        recognition.stop();
        void answerVoiceDoubt(finalQuestion);
      }
    };
    recognition.onend = () => {
      setListening(false);

      if (!submitted && capturedQuestion.trim()) {
        submitted = true;
        void answerVoiceDoubt(capturedQuestion);
      }
    };

    recognition.start();
  }

  return (
    <>
      <style jsx>{`
        @keyframes tutorAura {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.12);
          }
        }

        @keyframes tutorSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes tutorWave {
          0%,
          100% {
            transform: scaleY(0.38);
          }
          50% {
            transform: scaleY(1);
          }
        }

        @keyframes tutorPanelIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .voice-tutor-aura {
          animation: tutorAura 2.8s ease-in-out infinite;
        }

        .voice-tutor-ring {
          animation: tutorSpin 4.5s linear infinite;
          background: conic-gradient(
            from 0deg,
            #22d3ee,
            #2dd4bf,
            #a78bfa,
            #facc15,
            #22d3ee
          );
        }

        .voice-tutor-wave span {
          animation: tutorWave 850ms ease-in-out infinite;
          transform-origin: center;
        }

        .voice-tutor-wave span:nth-child(2) {
          animation-delay: 110ms;
        }

        .voice-tutor-wave span:nth-child(3) {
          animation-delay: 220ms;
        }

        .voice-tutor-panel {
          animation: tutorPanelIn 420ms ease-out both;
        }

        .voice-mic-pulse {
          animation: tutorAura 1.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .voice-tutor-aura,
          .voice-tutor-ring,
          .voice-tutor-wave span,
          .voice-tutor-panel,
          .voice-mic-pulse {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>

      {open ? (
        <section className="voice-tutor-panel fixed bottom-28 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-white/70 bg-white/95 p-5 shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/30 sm:right-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
                AI Voice Tutor
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-normal text-slate-950 dark:text-white">
                {heading}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeTutor}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg leading-none text-slate-500 transition hover:border-teal-300 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-teal-500/20 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
              aria-label="Close voice tutor"
            >
              x
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-400/15 dark:text-teal-200">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-teal-300/20 bg-teal-50 p-4 dark:bg-teal-300/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  Voice doubt tutor
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Tap the mic, ask your {exam || "chosen exam"} doubt, and the AI
                  will answer by voice.
                </p>
              </div>
              <button
                type="button"
                onClick={handleMicClick}
                disabled={answerLoading}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-white shadow-lg transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500/25 disabled:cursor-not-allowed disabled:opacity-70 ${
                  listening
                    ? "voice-mic-pulse border-rose-200 bg-rose-500"
                    : "border-teal-200 bg-teal-600 hover:bg-teal-500"
                }`}
                aria-label={listening ? "Stop listening" : "Ask doubt by voice"}
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <path d="M12 19v3" />
                </svg>
              </button>
            </div>

            {voiceQuestion ? (
              <p className="mt-3 rounded-xl border border-white/60 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
                {voiceQuestion}
              </p>
            ) : null}

            {answerLoading ? (
              <p className="mt-3 text-sm font-semibold text-teal-700 dark:text-teal-200">
                Thinking and preparing voice answer...
              </p>
            ) : null}

            {voiceAnswer ? (
              <p className="mt-3 rounded-xl border border-cyan-300/25 bg-cyan-50 px-3 py-2 text-sm leading-6 text-cyan-900 dark:bg-cyan-300/10 dark:text-cyan-100">
                {voiceAnswer}
              </p>
            ) : null}
          </div>

          {notice ? (
            <p className="mt-3 rounded-xl border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
              {notice}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={playTutor}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
            >
              Play Guide
            </button>
            <button
              type="button"
              onClick={stopTutor}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/20 dark:border-white/10 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
            >
              Stop Voice
            </button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={handleMicClick}
        disabled={answerLoading}
        className={`group fixed bottom-6 right-28 z-50 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl outline-none transition hover:scale-105 focus:ring-4 focus:ring-teal-500/25 disabled:cursor-not-allowed disabled:opacity-70 sm:bottom-9 sm:right-32 ${
          listening
            ? "voice-mic-pulse border-rose-200 bg-rose-500 text-white shadow-rose-500/30"
            : "border-teal-200/50 bg-slate-950 text-teal-100 shadow-teal-600/25 hover:border-teal-200"
        }`}
        aria-label={listening ? "Stop voice doubt" : "Ask a doubt by voice"}
        aria-pressed={listening}
      >
        <span className="absolute inset-[-0.35rem] rounded-full bg-teal-400/15 blur-md" />
        <svg
          aria-hidden="true"
          className="relative h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <path d="M12 19v3" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleTutorButtonClick}
        className="group fixed bottom-5 right-5 z-50 flex h-20 w-20 items-center justify-center rounded-full outline-none transition hover:scale-105 focus:ring-4 focus:ring-teal-500/25 sm:bottom-7 sm:right-7"
        aria-label={speaking ? "Stop AI voice tutor" : "Open AI voice tutor"}
        aria-pressed={speaking}
      >
        <span className="voice-tutor-aura absolute inset-[-0.55rem] rounded-full bg-teal-400/25 blur-lg" />
        <span className="voice-tutor-ring absolute inset-0 rounded-full p-[2px] shadow-2xl shadow-teal-600/30">
          <span className="block h-full w-full rounded-full bg-slate-950" />
        </span>
        <span className="relative flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border border-white/10 bg-slate-950 text-white shadow-inner shadow-white/10">
          <span className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(45,212,191,0.38),transparent_42%),radial-gradient(circle_at_72%_72%,rgba(167,139,250,0.3),transparent_44%)]" />
          <span className="relative grid gap-1 text-center">
            <span className="text-sm font-black tracking-normal">AI</span>
            <span className="voice-tutor-wave flex h-4 items-center justify-center gap-1">
              <span className="h-4 w-1 rounded-full bg-cyan-200" />
              <span className="h-4 w-1 rounded-full bg-teal-200" />
              <span className="h-4 w-1 rounded-full bg-amber-200" />
            </span>
          </span>
        </span>
      </button>
    </>
  );
}
