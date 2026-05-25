"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { AuthMessage } from "@/components/AuthMessage";
import {
  getChatHistoryRecord,
  saveChatHistoryRecord,
  type DoubtAnswer,
} from "@/lib/chatHistory";
import { trackDailyPresence, trackEngagementEvent } from "@/lib/engagement";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

type ChatMessage =
  | {
      id: string;
      role: "student";
      question: string;
    }
  | {
      id: string;
      role: "assistant";
      topic: string;
      answer: DoubtAnswer;
    };

function AiDoubtContent() {
  const searchParams = useSearchParams();
  const exam = searchParams.get("exam") ?? "your exam";
  const historyId = searchParams.get("history")?.trim() ?? "";
  const dashboardHref =
    exam && exam !== "your exam"
      ? `/study?exam=${encodeURIComponent(exam)}`
      : "/dashboard";
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, quizQuestions, quizIndex]);

  useEffect(() => {
    trackDailyPresence({ exam, area: "ai-doubt" });
  }, [exam]);

  useEffect(() => {
    if (!historyId) {
      return;
    }

    const historyRecord = getChatHistoryRecord(historyId);

    if (!historyRecord) {
      return;
    }

    setQuestion("");
    setError("");
    setQuizQuestions([]);
    setQuizTopic("");
    setQuizIndex(0);
    setSelectedOption(null);
    setScore(0);
    setMessages([
      {
        id: `${historyRecord.id}-student`,
        role: "student",
        question: historyRecord.question,
      },
      {
        id: `${historyRecord.id}-assistant`,
        role: "assistant",
        topic: historyRecord.question,
        answer: historyRecord.answer,
      },
    ]);
  }, [historyId]);

  const currentQuizQuestion = quizQuestions[quizIndex];
  const quizComplete =
    quizQuestions.length > 0 &&
    quizIndex === quizQuestions.length - 1 &&
    selectedOption !== null;

  function createMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function youtubeSearchUrl(searchQuery: string) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery,
    )}`;
  }

  function pdfSearchUrl(searchQuery: string) {
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }

  function latestQuizTopic() {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];

      if (message.role === "student") {
        return message.question;
      }
    }

    return `${exam} fundamentals`;
  }

  async function handleGenerateQuiz(topic: string) {
    const currentTopic = topic.trim();

    if (!currentTopic || quizLoading) {
      return;
    }

    setQuizError("");
    setQuizLoading(true);
    setQuizTopic(currentTopic);
    setQuizQuestions([]);
    setQuizIndex(0);
    setSelectedOption(null);
    setScore(0);

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: currentTopic, exam }),
      });

      const data = await response.json();

      if (!response.ok) {
        setQuizError(data.error ?? "Quiz generation failed.");
        return;
      }

      const nextQuestions = data.questions as QuizQuestion[];
      setQuizQuestions(nextQuestions);
      trackEngagementEvent({
        type: "quiz",
        exam,
        metadata: {
          questionCount: nextQuestions.length,
          topic: currentTopic,
        },
      });
    } catch {
      setQuizError("Could not reach the quiz route. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  }

  function handleOptionSelect(optionIndex: number) {
    if (!currentQuizQuestion || selectedOption !== null) {
      return;
    }

    setSelectedOption(optionIndex);

    if (optionIndex === currentQuizQuestion.correctAnswerIndex) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function handleNextQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((currentIndex) => currentIndex + 1);
      setSelectedOption(null);
    }
  }

  async function handleAskAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentQuestion = question.trim();

    if (!currentQuestion || loading) {
      return;
    }

    setError("");
    setQuestion("");
    setLoading(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId(),
        role: "student",
        question: currentQuestion,
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: currentQuestion, exam }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "AI request failed.");
        return;
      }

      const answer = data as DoubtAnswer;
      saveChatHistoryRecord({
        exam,
        question: currentQuestion,
        answer,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          topic: currentQuestion,
          answer,
        },
      ]);
    } catch {
      setError("Could not reach the AI route. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-100 px-3 py-3 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 sm:py-6">
      <section className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/70 bg-white shadow-glow dark:border-white/10 dark:bg-slate-900 sm:h-[calc(100vh-3rem)]">
        <header className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
              AI Doubt Solver
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              {exam} Chat
            </h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => handleGenerateQuiz(latestQuizTopic())}
              disabled={quizLoading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {quizLoading ? "Generating..." : "Generate Quiz"}
            </button>
            <Link
              href={dashboardHref}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-white/10 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
            >
              Dashboard
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 dark:bg-slate-950 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-5">
            {quizError ? <AuthMessage message={quizError} type="error" /> : null}

            {messages.length === 0 ? (
              <div className="flex min-h-[42vh] items-center justify-center">
                <div className="max-w-xl text-center">
                  <Image
                    src="/crack-ai-mark.png"
                    alt="Crack AI"
                    width={56}
                    height={56}
                    className="mx-auto h-14 w-14 rounded-2xl object-cover shadow-lg shadow-teal-600/20"
                  />
                  <h2 className="mt-5 text-2xl font-semibold tracking-normal">
                    Ask your first doubt
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Try a question like "Explain rotational motion for JEE".
                  </p>
                </div>
              </div>
            ) : null}

            {messages.map((message) =>
              message.role === "student" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-teal-600 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-teal-600/15 sm:max-w-[70%]">
                    {message.question}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex justify-start">
                  <article className="w-full max-w-3xl rounded-2xl rounded-bl-md border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white dark:bg-teal-500">
                        AI
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Doubt response</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {exam}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                          Explanation
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {message.answer.explanation}
                        </p>
                      </section>

                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                          Key concepts
                        </h3>
                        {message.answer.keyConcepts.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.answer.keyConcepts.map((concept) => (
                              <span
                                key={concept}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                            No key concepts returned.
                          </p>
                        )}
                      </section>

                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                          Summary
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {message.answer.summary}
                        </p>
                      </section>

                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                          Recommended resources
                        </h3>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {message.answer.resources.videos.map((video) => (
                            <a
                              key={`video-${video.title}`}
                              href={youtubeSearchUrl(video.searchQuery)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() =>
                                trackEngagementEvent({
                                  type: "resource",
                                  exam,
                                  metadata: {
                                    kind: "video",
                                    title: video.title,
                                    topic: message.topic,
                                  },
                                })
                              }
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-red-300 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-slate-950 dark:hover:border-red-400/60 dark:hover:bg-slate-900"
                            >
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600 dark:text-red-300">
                                YouTube video
                              </span>
                              <h4 className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                                {video.title}
                              </h4>
                              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                {video.description}
                              </p>
                            </a>
                          ))}

                          {message.answer.resources.pdfs.map((pdf) => (
                            <a
                              key={`pdf-${pdf.title}`}
                              href={pdfSearchUrl(pdf.searchQuery)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() =>
                                trackEngagementEvent({
                                  type: "resource",
                                  exam,
                                  metadata: {
                                    kind: "pdf",
                                    title: pdf.title,
                                    topic: message.topic,
                                  },
                                })
                              }
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-slate-950 dark:hover:border-blue-400/60 dark:hover:bg-slate-900"
                            >
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                                PDF notes
                              </span>
                              <h4 className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                                {pdf.title}
                              </h4>
                              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                {pdf.description}
                              </p>
                            </a>
                          ))}
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {message.answer.resources.topics.map((topic) => (
                            <div
                              key={`topic-${topic.title}`}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950"
                            >
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
                                Topic
                              </span>
                              <h4 className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                                {topic.title}
                              </h4>
                              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                {topic.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <button
                        type="button"
                        onClick={() => handleGenerateQuiz(message.topic)}
                        disabled={quizLoading}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {quizLoading ? "Generating quiz..." : "Generate Quiz"}
                      </button>
                    </div>
                  </article>
                </div>
              ),
            )}

            {quizLoading ? (
              <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:border-teal-500/30 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
                    aria-label="Generating quiz"
                  />
                  <p className="text-sm font-semibold">Generating quiz...</p>
                </div>
              </div>
            ) : null}

            {currentQuizQuestion ? (
              <section className="rounded-2xl border border-teal-200 bg-white p-4 shadow-sm dark:border-teal-500/30 dark:bg-slate-900 sm:p-5">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                      AI Quiz
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-normal">
                      {quizTopic}
                    </h2>
                  </div>
                  <div className="flex gap-2 text-sm font-semibold">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      {quizIndex + 1}/{quizQuestions.length}
                    </span>
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">
                      Score {score}/{quizQuestions.length}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-base font-semibold leading-7 text-slate-950 dark:text-white">
                    {currentQuizQuestion.question}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {currentQuizQuestion.options.map((option, optionIndex) => {
                      const isSelected = selectedOption === optionIndex;
                      const isCorrect =
                        currentQuizQuestion.correctAnswerIndex === optionIndex;
                      const showCorrect = selectedOption !== null && isCorrect;
                      const showWrong =
                        selectedOption !== null && isSelected && !isCorrect;
                      const optionStyle = showCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-200"
                        : showWrong
                          ? "border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-400/60 dark:bg-rose-500/10 dark:text-rose-200"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300 hover:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-teal-400/60 dark:hover:bg-slate-900";

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleOptionSelect(optionIndex)}
                          disabled={selectedOption !== null}
                          aria-pressed={isSelected}
                          className={`min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-medium transition disabled:cursor-default ${optionStyle}`}
                        >
                          <span className="mr-2 font-bold">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        Correct answer:{" "}
                        {
                          currentQuizQuestion.options[
                            currentQuizQuestion.correctAnswerIndex
                          ]
                        }
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {currentQuizQuestion.explanation}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {quizComplete ? (
                      <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                        Quiz complete. Final score: {score}/{quizQuestions.length}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Choose one option to check your answer.
                      </p>
                    )}

                    {selectedOption !== null && !quizComplete ? (
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
                      >
                        Next Question
                      </button>
                    ) : null}

                    {quizComplete ? (
                      <button
                        type="button"
                        onClick={() => handleGenerateQuiz(quizTopic)}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
                      >
                        Generate New Quiz
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center gap-2" aria-label="AI is thinking">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:p-4"
          onSubmit={handleAskAi}
        >
          <div className="mx-auto flex max-w-4xl gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              required
              placeholder={`Ask a ${exam} doubt...`}
              className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex h-12 min-w-24 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-label="Sending"
                />
              ) : (
                "Send"
              )}
            </button>
          </div>

          {error ? (
            <div className="mx-auto mt-3 max-w-4xl">
              <AuthMessage message={error} type="error" />
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}

export default function AiDoubtPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
            aria-label="Loading AI doubt page"
          />
        </main>
      }
    >
      <AiDoubtContent />
    </Suspense>
  );
}
