export type ResourceItem = {
  title: string;
  description: string;
  searchQuery: string;
};

export type TopicItem = {
  title: string;
  description: string;
};

export type ResourceRecommendations = {
  videos: ResourceItem[];
  pdfs: ResourceItem[];
  topics: TopicItem[];
};

export type DoubtAnswer = {
  explanation: string;
  keyConcepts: string[];
  summary: string;
  resources: ResourceRecommendations;
};

export type ChatHistoryRecord = {
  id: string;
  exam: string;
  question: string;
  answer: DoubtAnswer;
  createdAt: string;
};

const CHAT_HISTORY_STORAGE_KEY = "crack-ai-chat-history";
const MAX_HISTORY_ITEMS = 100;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createHistoryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isResourceItem(value: unknown): value is ResourceItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<ResourceItem>;
  return (
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.searchQuery === "string"
  );
}

function isTopicItem(value: unknown): value is TopicItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<TopicItem>;
  return typeof item.title === "string" && typeof item.description === "string";
}

function isDoubtAnswer(value: unknown): value is DoubtAnswer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const answer = value as Partial<DoubtAnswer>;
  const resources = answer.resources;

  return (
    typeof answer.explanation === "string" &&
    Array.isArray(answer.keyConcepts) &&
    answer.keyConcepts.every((concept) => typeof concept === "string") &&
    typeof answer.summary === "string" &&
    Boolean(resources) &&
    Array.isArray(resources?.videos) &&
    resources.videos.every(isResourceItem) &&
    Array.isArray(resources?.pdfs) &&
    resources.pdfs.every(isResourceItem) &&
    Array.isArray(resources?.topics) &&
    resources.topics.every(isTopicItem)
  );
}

function isHistoryRecord(value: unknown): value is ChatHistoryRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ChatHistoryRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.exam === "string" &&
    typeof record.question === "string" &&
    typeof record.createdAt === "string" &&
    isDoubtAnswer(record.answer)
  );
}

export function getChatHistory(exam?: string) {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const storedHistory = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    const parsedHistory = storedHistory ? JSON.parse(storedHistory) : [];

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    const normalizedExam = exam?.trim().toLowerCase();

    return parsedHistory
      .filter(isHistoryRecord)
      .filter((record) =>
        normalizedExam ? record.exam.trim().toLowerCase() === normalizedExam : true,
      )
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      );
  } catch {
    return [];
  }
}

export function getChatHistoryRecord(id: string) {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return null;
  }

  return getChatHistory().find((record) => record.id === normalizedId) ?? null;
}

export function saveChatHistoryRecord({
  exam,
  question,
  answer,
}: {
  exam: string;
  question: string;
  answer: DoubtAnswer;
}) {
  if (!canUseStorage()) {
    return null;
  }

  const record: ChatHistoryRecord = {
    id: createHistoryId(),
    exam,
    question,
    answer,
    createdAt: new Date().toISOString(),
  };

  try {
    const history = getChatHistory();
    window.localStorage.setItem(
      CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify([record, ...history].slice(0, MAX_HISTORY_ITEMS)),
    );
    return record;
  } catch {
    return null;
  }
}
