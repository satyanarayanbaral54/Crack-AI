import { NextRequest, NextResponse } from "next/server";
import {
  getFallbackMockQuestions,
  getMockTestConfig,
  normalizeMockQuestion,
  type MockQuestion,
} from "@/lib/mockTest";

type MockTestRequestBody = {
  exam?: unknown;
};

type MockTestResponse = {
  questions?: unknown;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseMockTest(content: string, exam: string, questionCount: number) {
  const parsed = JSON.parse(content) as MockTestResponse;
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .map((question, index) => normalizeMockQuestion(question, exam, index))
        .filter((question): question is MockQuestion => Boolean(question))
    : [];

  return questions.slice(0, questionCount);
}

export async function POST(request: NextRequest) {
  let body: MockTestRequestBody;

  try {
    body = (await request.json()) as MockTestRequestBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const exam = typeof body.exam === "string" ? body.exam.trim() : "";
  const config = getMockTestConfig(exam);

  if (!config) {
    return jsonError("A valid exam is required for mock test generation.", 400);
  }

  const fallbackQuestions = getFallbackMockQuestions(config.exam);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      questions: fallbackQuestions,
      generatedBy: "fallback",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  let openRouterResponse: Response;

  try {
    openRouterResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "Crack AI Mock Test Generator",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert Indian competitive exam paper setter. Return only valid JSON with this exact shape: {\"questions\":[{\"section\":\"string\",\"difficulty\":\"Exam-level|Advanced|High\",\"question\":\"string\",\"options\":[\"string\",\"string\",\"string\",\"string\"],\"correctAnswerIndex\":0,\"explanation\":\"string\",\"marks\":4,\"negativeMarks\":1}]}. Create challenging but unambiguous single-correct MCQs. Every question must have exactly 4 options and one correctAnswerIndex from 0 to 3. Keep explanations concise and exam-focused. Do not include markdown.",
          },
          {
            role: "user",
            content: [
              `Exam: ${config.exam}`,
              `Mock title: ${config.title}`,
              `Generate exactly ${config.mockQuestionCount} high-level MCQs.`,
              `Exam format: ${config.formatSummary}`,
              `Sections to cover: ${config.sections.join(", ")}`,
              `Marking reference: ${config.markingSummary}`,
              "Avoid easy school-level recall unless the exam itself demands it; prefer multi-step, concept-linked, competitive-level questions.",
              "Make the questions feel like a serious competitive exam practice set.",
            ].join("\n"),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.42,
        max_tokens: 5200,
      }),
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({
      questions: fallbackQuestions,
      generatedBy: "fallback",
      warning: "AI mock generation timed out, so fallback questions were used.",
    });
  }

  clearTimeout(timeout);

  let data: OpenRouterResponse;

  try {
    data = (await openRouterResponse.json()) as OpenRouterResponse;
  } catch {
    return NextResponse.json({
      questions: fallbackQuestions,
      generatedBy: "fallback",
      warning: "AI returned an unreadable response, so fallback questions were used.",
    });
  }

  if (!openRouterResponse.ok) {
    return NextResponse.json({
      questions: fallbackQuestions,
      generatedBy: "fallback",
      warning: data.error?.message ?? "AI mock generation failed, so fallback questions were used.",
    });
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json({
      questions: fallbackQuestions,
      generatedBy: "fallback",
      warning: "AI returned an empty mock test, so fallback questions were used.",
    });
  }

  try {
    const questions = parseMockTest(content, config.exam, config.mockQuestionCount);

    if (questions.length !== config.mockQuestionCount) {
      return NextResponse.json({
        questions: fallbackQuestions,
        generatedBy: "fallback",
        warning: "AI returned an incomplete mock test, so fallback questions were used.",
      });
    }

    return NextResponse.json({ questions, generatedBy: "ai" });
  } catch {
    return NextResponse.json({
      questions: fallbackQuestions,
      generatedBy: "fallback",
      warning: "AI returned invalid mock JSON, so fallback questions were used.",
    });
  }
}
