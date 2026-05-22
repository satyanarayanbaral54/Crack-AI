import { NextRequest, NextResponse } from "next/server";

type ChatRequestBody = {
  question?: unknown;
  exam?: unknown;
};

type DoubtAnswer = {
  explanation: string;
  keyConcepts: string[];
  summary: string;
  resources: ResourceRecommendations;
};

type ResourceItem = {
  title: string;
  description: string;
  searchQuery: string;
};

type TopicItem = {
  title: string;
  description: string;
};

type ResourceRecommendations = {
  videos: ResourceItem[];
  pdfs: ResourceItem[];
  topics: TopicItem[];
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

function fallbackResources(question: string, exam: string): ResourceRecommendations {
  const topic = question.slice(0, 90);

  return {
    videos: [
      {
        title: `${exam} concept video`,
        description: "Search for a clear lecture that explains this doubt step by step.",
        searchQuery: `${exam} ${topic} explanation`,
      },
      {
        title: `${exam} solved examples`,
        description: "Practice with worked examples after learning the concept.",
        searchQuery: `${exam} ${topic} solved examples`,
      },
    ],
    pdfs: [
      {
        title: `${exam} notes PDF`,
        description: "Find concise notes for quick revision and formulas.",
        searchQuery: `${exam} ${topic} notes PDF`,
      },
      {
        title: "NCERT chapter reference",
        description: "Use the relevant NCERT chapter to strengthen fundamentals.",
        searchQuery: `NCERT ${topic} chapter PDF`,
      },
    ],
    topics: [
      {
        title: "Revise the core definition",
        description: "Start with the main definition and the conditions where it applies.",
      },
      {
        title: "Practice application questions",
        description: "Solve two to three related problems to check understanding.",
      },
    ],
  };
}

function normalizeResourceItems(value: unknown): ResourceItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const resource = item as Partial<ResourceItem>;
      const title = String(resource.title ?? "").trim();
      const description = String(resource.description ?? "").trim();
      const searchQuery = String(resource.searchQuery ?? title).trim();

      if (!title) {
        return null;
      }

      return {
        title,
        description,
        searchQuery,
      };
    })
    .filter((item): item is ResourceItem => Boolean(item));
}

function normalizeTopicItems(value: unknown): TopicItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const topic = item as Partial<TopicItem>;
      const title = String(topic.title ?? "").trim();
      const description = String(topic.description ?? "").trim();

      if (!title) {
        return null;
      }

      return {
        title,
        description,
      };
    })
    .filter((item): item is TopicItem => Boolean(item));
}

function normalizeResources(
  resources: unknown,
  question: string,
  exam: string,
): ResourceRecommendations {
  const fallback = fallbackResources(question, exam);
  const value =
    resources && typeof resources === "object"
      ? (resources as Partial<ResourceRecommendations>)
      : {};

  const videos = normalizeResourceItems(value.videos);
  const pdfs = normalizeResourceItems(value.pdfs);
  const topics = normalizeTopicItems(value.topics);

  return {
    videos: videos.length > 0 ? videos : fallback.videos,
    pdfs: pdfs.length > 0 ? pdfs : fallback.pdfs,
    topics: topics.length > 0 ? topics : fallback.topics,
  };
}

function parseAnswer(content: string, question: string, exam: string): DoubtAnswer {
  try {
    const parsed = JSON.parse(content) as Partial<DoubtAnswer>;

    return {
      explanation: String(parsed.explanation ?? "").trim(),
      keyConcepts: Array.isArray(parsed.keyConcepts)
        ? parsed.keyConcepts.map(String).filter(Boolean)
        : [],
      summary: String(parsed.summary ?? "").trim(),
      resources: normalizeResources(parsed.resources, question, exam),
    };
  } catch {
    return {
      explanation: content.trim(),
      keyConcepts: [],
      summary: "Review the explanation above and practice similar questions.",
      resources: fallbackResources(question, exam),
    };
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return jsonError("Missing OPENROUTER_API_KEY in .env.local.", 500);
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const exam = typeof body.exam === "string" ? body.exam.trim() : "General";

  if (!question) {
    return jsonError("Question is required.", 400);
  }

  if (question.length > 4000) {
    return jsonError("Question is too long. Keep it under 4000 characters.", 400);
  }

  const openRouterResponse = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Student AI Doubt Solver",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a patient exam tutor for Indian students. Answer doubts clearly and accurately. Return only valid JSON with this exact shape: {\"explanation\":\"string\",\"keyConcepts\":[\"string\"],\"summary\":\"string\",\"resources\":{\"videos\":[{\"title\":\"string\",\"description\":\"string\",\"searchQuery\":\"string\"}],\"pdfs\":[{\"title\":\"string\",\"description\":\"string\",\"searchQuery\":\"string\"}],\"topics\":[{\"title\":\"string\",\"description\":\"string\"}]}}. Recommend YouTube video searches, PDF note searches, NCERT chapters when relevant, and follow-up topics. Keep everything concise, exam-focused, and easy to revise.",
        },
        {
          role: "user",
          content: `Exam: ${exam}\nStudent question: ${question}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1200,
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
      data.error?.message ?? "OpenRouter request failed.",
      openRouterResponse.status,
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return jsonError("OpenRouter returned an empty answer.", 502);
  }

  return NextResponse.json(parseAnswer(content, question, exam));
}
