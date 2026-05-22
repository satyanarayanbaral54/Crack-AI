import { NextRequest, NextResponse } from "next/server";

type QuizRequestBody = {
  topic?: unknown;
  exam?: unknown;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

type QuizResponse = {
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

function normalizeQuestion(value: unknown): QuizQuestion | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<QuizQuestion>;
  const question = String(item.question ?? "").trim();
  const options = Array.isArray(item.options)
    ? item.options.map(String).map((option) => option.trim()).filter(Boolean)
    : [];
  const explanation = String(item.explanation ?? "").trim();
  const rawCorrectIndex = Number(item.correctAnswerIndex);

  if (!question || options.length !== 4 || !Number.isInteger(rawCorrectIndex)) {
    return null;
  }

  if (rawCorrectIndex < 0 || rawCorrectIndex > 3) {
    return null;
  }

  return {
    question,
    options,
    correctAnswerIndex: rawCorrectIndex,
    explanation,
  };
}

function parseQuiz(content: string): QuizQuestion[] {
  const parsed = JSON.parse(content) as QuizResponse;
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.map(normalizeQuestion).filter(Boolean)
    : [];

  return questions.slice(0, 5) as QuizQuestion[];
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return jsonError("Missing OPENROUTER_API_KEY in .env.local.", 500);
  }

  let body: QuizRequestBody;

  try {
    body = (await request.json()) as QuizRequestBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const exam = typeof body.exam === "string" ? body.exam.trim() : "General";

  if (!topic) {
    return jsonError("Topic is required.", 400);
  }

  if (topic.length > 1000) {
    return jsonError("Topic is too long. Keep it under 1000 characters.", 400);
  }

  const openRouterResponse = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Student AI Quiz Generator",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content:
            "You are an expert exam tutor. Create a quiz for Indian students. Return only valid JSON with this exact shape: {\"questions\":[{\"question\":\"string\",\"options\":[\"string\",\"string\",\"string\",\"string\"],\"correctAnswerIndex\":0,\"explanation\":\"string\"}]}. Generate exactly 5 MCQs. Each MCQ must have exactly 4 options. correctAnswerIndex must be 0, 1, 2, or 3. Explanations should be concise and exam-focused.",
        },
        {
          role: "user",
          content: `Exam: ${exam}\nTopic: ${topic}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: 1800,
    }),
  });

  let data: OpenRouterResponse;

  try {
    data = (await openRouterResponse.json()) as OpenRouterResponse;
  } catch {
    return jsonError("OpenRouter returned an unreadable response.", 502);
  }

  if (!openRouterResponse.ok) {
    return jsonError(
      data.error?.message ?? "OpenRouter quiz request failed.",
      openRouterResponse.status,
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return jsonError("OpenRouter returned an empty quiz.", 502);
  }

  try {
    const questions = parseQuiz(content);

    if (questions.length !== 5) {
      return jsonError("AI returned an incomplete quiz. Please try again.", 502);
    }

    return NextResponse.json({ questions });
  } catch {
    return jsonError("AI returned invalid quiz JSON. Please try again.", 502);
  }
}
