export type EngagementType = "presence" | "quiz" | "resource" | "syllabus";

export type EngagementMetadata = Record<
  string,
  boolean | number | string | string[]
>;

export type EngagementEvent = {
  id: string;
  type: EngagementType;
  exam: string;
  createdAt: string;
  metadata?: EngagementMetadata;
};

const ENGAGEMENT_STORAGE_KEY = "crack-ai-engagement-events";
const MAX_ENGAGEMENT_EVENTS = 700;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createEngagementId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeExam(exam?: string) {
  const trimmedExam = exam?.trim();
  return trimmedExam || "Crack AI";
}

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

export function formatLocalDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function isEngagementType(value: unknown): value is EngagementType {
  return (
    value === "presence" ||
    value === "quiz" ||
    value === "resource" ||
    value === "syllabus"
  );
}

function isMetadata(value: unknown): value is EngagementMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((item) => {
    if (
      typeof item === "boolean" ||
      typeof item === "number" ||
      typeof item === "string"
    ) {
      return true;
    }

    return Array.isArray(item) && item.every((entry) => typeof entry === "string");
  });
}

function isEngagementEvent(value: unknown): value is EngagementEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<EngagementEvent>;

  return (
    typeof event.id === "string" &&
    isEngagementType(event.type) &&
    typeof event.exam === "string" &&
    typeof event.createdAt === "string" &&
    (!event.metadata || isMetadata(event.metadata))
  );
}

function readEngagementEvents() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const storedEvents = window.localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    const parsedEvents = storedEvents ? JSON.parse(storedEvents) : [];

    if (!Array.isArray(parsedEvents)) {
      return [];
    }

    return parsedEvents
      .filter(isEngagementEvent)
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );
  } catch {
    return [];
  }
}

function saveEngagementEvents(events: EngagementEvent[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    ENGAGEMENT_STORAGE_KEY,
    JSON.stringify(events.slice(0, MAX_ENGAGEMENT_EVENTS)),
  );
}

export function getEngagementEvents(exam?: string) {
  const normalizedExam = exam?.trim().toLowerCase();

  return readEngagementEvents().filter((event) =>
    normalizedExam ? event.exam.trim().toLowerCase() === normalizedExam : true,
  );
}

export function trackEngagementEvent({
  type,
  exam,
  metadata,
}: {
  type: EngagementType;
  exam?: string;
  metadata?: EngagementMetadata;
}) {
  if (!canUseStorage()) {
    return null;
  }

  const event: EngagementEvent = {
    id: createEngagementId(),
    type,
    exam: normalizeExam(exam),
    createdAt: new Date().toISOString(),
    metadata,
  };

  try {
    saveEngagementEvents([event, ...readEngagementEvents()]);
    return event;
  } catch {
    return null;
  }
}

export function trackDailyPresence({
  exam,
  area,
}: {
  exam?: string;
  area: string;
}) {
  if (!canUseStorage()) {
    return null;
  }

  const normalizedExam = normalizeExam(exam);
  const todayKey = formatLocalDateKey(new Date());
  const currentEvents = readEngagementEvents();
  const existingIndex = currentEvents.findIndex(
    (event) =>
      event.type === "presence" &&
      event.exam.trim().toLowerCase() === normalizedExam.toLowerCase() &&
      formatLocalDateKey(event.createdAt) === todayKey,
  );

  if (existingIndex === -1) {
    return trackEngagementEvent({
      type: "presence",
      exam: normalizedExam,
      metadata: {
        areas: [area],
        date: todayKey,
        visits: 1,
      },
    });
  }

  const existingEvent = currentEvents[existingIndex];
  const currentAreas = Array.isArray(existingEvent.metadata?.areas)
    ? existingEvent.metadata.areas
    : [];
  const currentVisits =
    typeof existingEvent.metadata?.visits === "number"
      ? existingEvent.metadata.visits
      : 1;
  const updatedEvent: EngagementEvent = {
    ...existingEvent,
    metadata: {
      ...existingEvent.metadata,
      areas: Array.from(new Set([...currentAreas, area])),
      lastSeenAt: new Date().toISOString(),
      visits: currentVisits + 1,
    },
  };

  try {
    saveEngagementEvents([
      updatedEvent,
      ...currentEvents.filter((event) => event.id !== existingEvent.id),
    ]);
    return updatedEvent;
  } catch {
    return null;
  }
}
