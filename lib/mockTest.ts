export type MockDifficulty = "Exam-level" | "Advanced" | "High";

export type MockQuestion = {
  id: string;
  section: string;
  difficulty: MockDifficulty;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  marks: number;
  negativeMarks: number;
};

export type MockTestConfig = {
  exam: string;
  title: string;
  durationMinutes: number;
  mockDurationMinutes: number;
  officialQuestionCount: number;
  mockQuestionCount: number;
  officialTotalMarks: number;
  markingSummary: string;
  formatSummary: string;
  sections: string[];
  instructions: string[];
  sourceHref: string;
  sourceLabel: string;
};

type QuestionSeed = Omit<
  MockQuestion,
  "id" | "marks" | "negativeMarks"
> & {
  marks?: number;
  negativeMarks?: number;
};

export const MOCK_TEST_CONFIGS: Record<string, MockTestConfig> = {
  JEE: {
    exam: "JEE",
    title: "JEE Main Paper 1 MCQ Mock",
    durationMinutes: 180,
    mockDurationMinutes: 24,
    officialQuestionCount: 75,
    mockQuestionCount: 8,
    officialTotalMarks: 300,
    markingSummary: "+4 correct, -1 incorrect, 0 unattempted",
    formatSummary:
      "Physics, Chemistry, and Mathematics with high-pressure numerical reasoning.",
    sections: ["Physics", "Chemistry", "Mathematics"],
    instructions: [
      "Use the timer like a real JEE Main session.",
      "Every question is single-correct MCQ for this mock.",
      "Unanswered questions carry zero marks.",
      "Submit before time ends, or the mock will submit automatically.",
    ],
    sourceHref: "https://jeemain.nta.nic.in/information-bulletin/",
    sourceLabel: "JEE Main information bulletin",
  },
  NEET: {
    exam: "NEET",
    title: "NEET UG MCQ Mock",
    durationMinutes: 180,
    mockDurationMinutes: 12,
    officialQuestionCount: 180,
    mockQuestionCount: 8,
    officialTotalMarks: 720,
    markingSummary: "+4 correct, -1 incorrect, 0 unattempted",
    formatSummary:
      "Physics, Chemistry, Botany, and Zoology with speed plus accuracy.",
    sections: ["Physics", "Chemistry", "Botany", "Zoology"],
    instructions: [
      "Attempt every question only when you are confident.",
      "Watch negative marking on close biology and chemistry options.",
      "Use rough work for Physics and Chemistry numericals.",
      "The mock auto-submits when the timer reaches zero.",
    ],
    sourceHref: "https://neet.nta.nic.in/admission-bulletin/",
    sourceLabel: "NEET UG admission bulletin",
  },
  UPSC: {
    exam: "UPSC",
    title: "UPSC Prelims GS MCQ Mock",
    durationMinutes: 120,
    mockDurationMinutes: 12,
    officialQuestionCount: 100,
    mockQuestionCount: 8,
    officialTotalMarks: 200,
    markingSummary: "+2 correct, -0.66 incorrect, 0 unattempted",
    formatSummary:
      "Prelims-style conceptual MCQs across polity, economy, geography, environment, and history.",
    sections: ["Polity", "Economy", "Geography", "Environment", "History"],
    instructions: [
      "Read every statement carefully before choosing an option.",
      "Avoid blind guessing because wrong answers reduce marks.",
      "Use elimination when two options look close.",
      "The mock submits automatically when time ends.",
    ],
    sourceHref: "https://upsc.gov.in/examinations",
    sourceLabel: "UPSC examinations",
  },
  GATE: {
    exam: "GATE",
    title: "GATE Technical MCQ Mock",
    durationMinutes: 180,
    mockDurationMinutes: 24,
    officialQuestionCount: 65,
    mockQuestionCount: 8,
    officialTotalMarks: 100,
    markingSummary:
      "MCQ-style scoring in this mock: +2 correct, -0.67 incorrect, 0 unattempted",
    formatSummary:
      "General aptitude plus technical application, analysis, and synthesis.",
    sections: [
      "General Aptitude",
      "Engineering Mathematics",
      "Computer Science",
    ],
    instructions: [
      "Solve technical questions with exam-level precision.",
      "Keep track of negative marking for wrong MCQs.",
      "Do not spend too long on one hard calculation.",
      "The mock will lock and submit automatically when time ends.",
    ],
    sourceHref: "https://gate2026.iitg.ac.in/question-paper-pattern.html",
    sourceLabel: "GATE 2026 question paper pattern",
  },
  CAT: {
    exam: "CAT",
    title: "CAT Aptitude MCQ Mock",
    durationMinutes: 120,
    mockDurationMinutes: 15,
    officialQuestionCount: 68,
    mockQuestionCount: 8,
    officialTotalMarks: 204,
    markingSummary: "+3 correct, -1 incorrect, 0 unattempted",
    formatSummary:
      "VARC, DILR, and Quant with section-style pressure and fast decision-making.",
    sections: ["VARC", "DILR", "Quantitative Aptitude"],
    instructions: [
      "Treat the set as a timed decision-making drill.",
      "Use elimination on verbal and DILR questions.",
      "Avoid low-confidence guesses when accuracy is falling.",
      "The mock auto-submits once the timer reaches zero.",
    ],
    sourceHref: "https://iimcat.ac.in/",
    sourceLabel: "CAT official website",
  },
};

const FALLBACK_QUESTIONS: Record<string, QuestionSeed[]> = {
  JEE: [
    {
      section: "Physics",
      difficulty: "High",
      question:
        "A particle attached to a spring is released from rest at x = A. If the force is F = -kx, the first time it reaches x = 0 is:",
      options: [
        "pi sqrt(m/k)",
        "(pi/2) sqrt(m/k)",
        "sqrt(m/k)",
        "2 pi sqrt(m/k)",
      ],
      correctAnswerIndex: 1,
      explanation:
        "The motion is SHM with angular frequency sqrt(k/m). From extreme to mean position takes one-fourth of the time period.",
    },
    {
      section: "Physics",
      difficulty: "Advanced",
      question:
        "A capacitor C charged to V is connected in parallel with an uncharged capacitor 2C. The energy lost is:",
      options: ["CV^2/6", "CV^2/3", "CV^2/2", "2CV^2/3"],
      correctAnswerIndex: 1,
      explanation:
        "Final voltage is V/3. Initial energy is CV^2/2 and final energy is CV^2/6, so loss is CV^2/3.",
    },
    {
      section: "Chemistry",
      difficulty: "Exam-level",
      question:
        "A first-order reaction is 75 percent complete in 20 minutes. Its half-life is:",
      options: ["5 min", "10 min", "15 min", "20 min"],
      correctAnswerIndex: 1,
      explanation:
        "75 percent completion means 25 percent remains, which is two half-lives. Therefore half-life is 10 minutes.",
    },
    {
      section: "Chemistry",
      difficulty: "High",
      question: "Which species has the highest bond order?",
      options: ["O2", "O2+", "O2-", "O2^2-"],
      correctAnswerIndex: 1,
      explanation:
        "Removing one electron from antibonding orbital in O2 gives O2+ a bond order of 2.5.",
    },
    {
      section: "Mathematics",
      difficulty: "High",
      question: "The value of integral from 0 to pi/2 of ln(sin x) dx is:",
      options: [
        "0",
        "-(pi/2) ln 2",
        "-pi ln 2",
        "(pi/2) ln 2",
      ],
      correctAnswerIndex: 1,
      explanation:
        "This is the standard Wallis integral result: integral ln(sin x) from 0 to pi/2 equals -(pi/2) ln 2.",
    },
    {
      section: "Mathematics",
      difficulty: "Exam-level",
      question:
        "If alpha and beta are roots of x^2 - 5x + 6 = 0, then alpha^2 + beta^2 equals:",
      options: ["11", "12", "13", "25"],
      correctAnswerIndex: 2,
      explanation:
        "alpha + beta = 5 and alpha beta = 6. So alpha^2 + beta^2 = 25 - 12 = 13.",
    },
    {
      section: "Physics",
      difficulty: "Advanced",
      question:
        "For a uniformly charged semicircular arc of radius R and total charge Q, the electric field at the center has magnitude:",
      options: [
        "kQ/R^2",
        "2kQ/(pi R^2)",
        "kQ/(pi R^2)",
        "0",
      ],
      correctAnswerIndex: 1,
      explanation:
        "The horizontal components cancel and vertical components add, giving E = 2kQ/(pi R^2).",
    },
    {
      section: "Chemistry",
      difficulty: "High",
      question: "The pH of 10^-8 M HCl at 25 C is closest to:",
      options: ["8.00", "7.00", "6.98", "6.00"],
      correctAnswerIndex: 2,
      explanation:
        "Water ionization cannot be ignored. The hydrogen ion concentration is slightly above 10^-7 M, so pH is about 6.98.",
    },
  ],
  NEET: [
    {
      section: "Botany",
      difficulty: "Exam-level",
      question:
        "In Michaelis-Menten enzyme kinetics, the substrate concentration at which reaction velocity is half of Vmax is:",
      options: ["Vmax", "Km", "1/Km", "2Km"],
      correctAnswerIndex: 1,
      explanation:
        "Km is defined as the substrate concentration at which velocity is Vmax/2.",
    },
    {
      section: "Physics",
      difficulty: "High",
      question:
        "For a hydrogen-like atom, the radius of the nth Bohr orbit is proportional to:",
      options: ["n/Z", "Z/n^2", "n^2/Z", "Z^2/n"],
      correctAnswerIndex: 2,
      explanation:
        "The Bohr orbit radius follows r_n = a0 n^2/Z.",
    },
    {
      section: "Zoology",
      difficulty: "High",
      question:
        "In a Hardy-Weinberg population, if frequency of recessive phenotype is 0.09, the heterozygote frequency is:",
      options: ["0.21", "0.42", "0.49", "0.91"],
      correctAnswerIndex: 1,
      explanation:
        "q^2 = 0.09, so q = 0.3 and p = 0.7. Heterozygotes = 2pq = 0.42.",
    },
    {
      section: "Chemistry",
      difficulty: "Advanced",
      question:
        "For a galvanic cell, if Q becomes greater than K, the cell reaction will:",
      options: [
        "Proceed forward faster",
        "Be at equilibrium",
        "Shift backward",
        "Have Ecell equal to Ecell standard",
      ],
      correctAnswerIndex: 2,
      explanation:
        "When Q exceeds K, products are excessive and the reaction shifts backward to reach equilibrium.",
    },
    {
      section: "Zoology",
      difficulty: "Exam-level",
      question: "The immunoglobulin mainly associated with allergic reactions is:",
      options: ["IgA", "IgE", "IgG", "IgM"],
      correctAnswerIndex: 1,
      explanation:
        "IgE binds mast cells and basophils and mediates immediate hypersensitivity reactions.",
    },
    {
      section: "Botany",
      difficulty: "Exam-level",
      question: "The first stable product of CO2 fixation in C3 plants is:",
      options: ["OAA", "3-PGA", "RuBP", "PEP"],
      correctAnswerIndex: 1,
      explanation:
        "C3 plants first form 3-phosphoglyceric acid through the Calvin cycle.",
    },
    {
      section: "Physics",
      difficulty: "Exam-level",
      question: "A concave lens has focal length -25 cm. Its power is:",
      options: ["-4 D", "+4 D", "-0.25 D", "+0.25 D"],
      correctAnswerIndex: 0,
      explanation:
        "Power P = 1/f in meters. f = -0.25 m, so P = -4 diopters.",
    },
    {
      section: "Chemistry",
      difficulty: "High",
      question:
        "For an ideal gas undergoing isothermal expansion, the change in internal energy is:",
      options: ["Positive", "Negative", "Zero", "Equal to work done"],
      correctAnswerIndex: 2,
      explanation:
        "Internal energy of an ideal gas depends only on temperature, which is constant in an isothermal process.",
    },
  ],
  UPSC: [
    {
      section: "Polity",
      difficulty: "Exam-level",
      question:
        "Which Article of the Constitution empowers citizens to move the Supreme Court for enforcement of Fundamental Rights?",
      options: ["Article 14", "Article 19", "Article 21", "Article 32"],
      correctAnswerIndex: 3,
      explanation:
        "Article 32 provides the right to constitutional remedies for enforcement of Fundamental Rights.",
    },
    {
      section: "Geography",
      difficulty: "High",
      question:
        "El Nino generally weakens the Indian summer monsoon because it is associated with:",
      options: [
        "Cooler eastern Pacific waters",
        "Warmer central and eastern Pacific waters",
        "Permanent Himalayan snow cover",
        "Stronger Mascarene High only",
      ],
      correctAnswerIndex: 1,
      explanation:
        "El Nino warming in the central/eastern Pacific alters circulation and often suppresses Indian monsoon rainfall.",
    },
    {
      section: "Economy",
      difficulty: "Exam-level",
      question: "GDP deflator is best described as:",
      options: [
        "Nominal GDP divided by real GDP multiplied by 100",
        "Real GDP divided by nominal GDP multiplied by 100",
        "CPI divided by WPI",
        "Fiscal deficit divided by GDP",
      ],
      correctAnswerIndex: 0,
      explanation:
        "GDP deflator = nominal GDP / real GDP x 100 and captures economy-wide price changes.",
    },
    {
      section: "Polity",
      difficulty: "High",
      question:
        "Directive Principles of State Policy are different from Fundamental Rights because they are:",
      options: [
        "Enforceable by courts",
        "Not justiciable but fundamental in governance",
        "Applicable only during Emergency",
        "Repealed by ordinary law",
      ],
      correctAnswerIndex: 1,
      explanation:
        "DPSPs are non-justiciable, yet the Constitution treats them as fundamental in governance.",
    },
    {
      section: "Environment",
      difficulty: "High",
      question:
        "A biodiversity hotspot is identified mainly by high endemism and:",
      options: [
        "High annual rainfall only",
        "Large desert area",
        "Significant habitat loss",
        "Maximum river density",
      ],
      correctAnswerIndex: 2,
      explanation:
        "Hotspots are defined by exceptional endemism and severe threat or habitat loss.",
    },
    {
      section: "Polity",
      difficulty: "Exam-level",
      question:
        "The decision whether a Bill is a Money Bill is finally made by the:",
      options: [
        "President",
        "Prime Minister",
        "Speaker of Lok Sabha",
        "Chairman of Rajya Sabha",
      ],
      correctAnswerIndex: 2,
      explanation:
        "The Speaker of Lok Sabha certifies whether a Bill is a Money Bill.",
    },
    {
      section: "History",
      difficulty: "High",
      question:
        "The key economic criticism made by Dadabhai Naoroji against British rule was the:",
      options: [
        "Theory of surplus value",
        "Drain of wealth",
        "Green revolution",
        "Permanent revolution",
      ],
      correctAnswerIndex: 1,
      explanation:
        "Naoroji's drain theory argued that colonial rule transferred Indian wealth to Britain.",
    },
    {
      section: "Economy",
      difficulty: "Advanced",
      question:
        "A higher primary deficit usually indicates that government borrowing is being used mainly for:",
      options: [
        "Interest payments only",
        "Non-interest expenditure",
        "Foreign exchange reserves",
        "Revenue surplus",
      ],
      correctAnswerIndex: 1,
      explanation:
        "Primary deficit is fiscal deficit minus interest payments, so it reflects borrowing for non-interest expenditure.",
    },
  ],
  GATE: [
    {
      section: "Computer Science",
      difficulty: "Exam-level",
      question:
        "The time complexity of depth-first search on a graph with V vertices and E edges using adjacency lists is:",
      options: ["O(V)", "O(E)", "O(V + E)", "O(VE)"],
      correctAnswerIndex: 2,
      explanation:
        "DFS visits each vertex and scans each adjacency list edge once, giving O(V + E).",
    },
    {
      section: "Computer Science",
      difficulty: "High",
      question:
        "Which condition is necessary for deadlock to occur in an operating system?",
      options: [
        "Preemption",
        "Hold and wait",
        "Single user mode",
        "Shortest job first",
      ],
      correctAnswerIndex: 1,
      explanation:
        "Hold and wait is one of the Coffman necessary conditions for deadlock.",
    },
    {
      section: "Computer Science",
      difficulty: "High",
      question:
        "TCP congestion control classically follows which strategy for congestion window adjustment?",
      options: ["AIMD", "MIMD", "LIFO", "LRU"],
      correctAnswerIndex: 0,
      explanation:
        "TCP uses additive increase and multiplicative decrease to probe and respond to congestion.",
    },
    {
      section: "Computer Science",
      difficulty: "Exam-level",
      question:
        "A foreign key in a relational table primarily enforces:",
      options: [
        "Entity integrity",
        "Referential integrity",
        "Domain independence",
        "Tuple ordering",
      ],
      correctAnswerIndex: 1,
      explanation:
        "A foreign key ensures that referenced values exist in the related parent table.",
    },
    {
      section: "Engineering Mathematics",
      difficulty: "High",
      question:
        "Minimum number of parity bits needed to encode 4 data bits using a Hamming code is:",
      options: ["2", "3", "4", "5"],
      correctAnswerIndex: 1,
      explanation:
        "For m = 4, choose r such that 2^r >= m + r + 1. r = 3 satisfies 8 >= 8.",
    },
    {
      section: "Engineering Mathematics",
      difficulty: "Advanced",
      question: "The number of spanning trees in complete graph K4 is:",
      options: ["4", "8", "12", "16"],
      correctAnswerIndex: 3,
      explanation:
        "By Cayley's formula, complete graph Kn has n^(n-2) spanning trees. For K4, it is 4^2 = 16.",
    },
    {
      section: "General Aptitude",
      difficulty: "Exam-level",
      question:
        "If a process is both CPU-bound and I/O-bound in alternating phases, the best scheduler objective is to:",
      options: [
        "Maximize only turnaround time",
        "Balance CPU utilization and response time",
        "Disable preemption",
        "Use only FCFS always",
      ],
      correctAnswerIndex: 1,
      explanation:
        "A good scheduler balances resource utilization with acceptable responsiveness.",
    },
    {
      section: "Computer Science",
      difficulty: "High",
      question:
        "In an ideal k-stage pipeline with many independent instructions, maximum speedup approaches:",
      options: ["1", "k", "k^2", "log k"],
      correctAnswerIndex: 1,
      explanation:
        "Ignoring hazards and overhead, an ideal k-stage pipeline can approach k-fold speedup.",
    },
  ],
  CAT: [
    {
      section: "Quantitative Aptitude",
      difficulty: "Exam-level",
      question:
        "A number is increased by 20 percent and then decreased by 20 percent. The net change is:",
      options: ["No change", "4 percent decrease", "4 percent increase", "2 percent decrease"],
      correctAnswerIndex: 1,
      explanation:
        "1.2 x 0.8 = 0.96, so the final value is 4 percent lower.",
    },
    {
      section: "Quantitative Aptitude",
      difficulty: "High",
      question:
        "If x + 1/x = 5 for x > 0, then x^2 + 1/x^2 equals:",
      options: ["21", "23", "25", "27"],
      correctAnswerIndex: 1,
      explanation:
        "Squaring gives x^2 + 2 + 1/x^2 = 25, hence x^2 + 1/x^2 = 23.",
    },
    {
      section: "DILR",
      difficulty: "High",
      question:
        "Five people A, B, C, D, E sit in a row. A is left of B, C is right of D, and E is between A and C. Which must be true?",
      options: [
        "A is at the extreme left",
        "E is not at an extreme position",
        "B is immediately right of A",
        "D is at the extreme right",
      ],
      correctAnswerIndex: 1,
      explanation:
        "Since E is between A and C, E cannot occupy either extreme position.",
    },
    {
      section: "VARC",
      difficulty: "Exam-level",
      question:
        "Choose the sentence with the clearest meaning.",
      options: [
        "The report, which was submitted late, contained several errors.",
        "The report which was submitted late contained errors several.",
        "Late submitted report contained errors several.",
        "Several errors contained the report submitted late.",
      ],
      correctAnswerIndex: 0,
      explanation:
        "Option A is grammatically clear and naturally expresses the idea.",
    },
    {
      section: "Quantitative Aptitude",
      difficulty: "Advanced",
      question:
        "A shopkeeper marks an item 25 percent above cost and gives a 10 percent discount. Profit percentage is:",
      options: ["10 percent", "12.5 percent", "15 percent", "22.5 percent"],
      correctAnswerIndex: 1,
      explanation:
        "Selling price = 1.25 x 0.90 = 1.125 times cost, so profit is 12.5 percent.",
    },
    {
      section: "DILR",
      difficulty: "High",
      question:
        "In a group, 60 percent know English, 50 percent know Hindi, and 20 percent know neither. What percent know both?",
      options: ["10", "20", "30", "40"],
      correctAnswerIndex: 2,
      explanation:
        "At least one language = 80 percent. Both = 60 + 50 - 80 = 30 percent.",
    },
    {
      section: "VARC",
      difficulty: "High",
      question:
        "The word closest in meaning to 'laconic' is:",
      options: ["Verbose", "Brief", "Angry", "Decorative"],
      correctAnswerIndex: 1,
      explanation:
        "Laconic means using very few words; brief is the closest option.",
    },
    {
      section: "Quantitative Aptitude",
      difficulty: "Exam-level",
      question:
        "If the average of five consecutive integers is 18, the largest integer is:",
      options: ["18", "19", "20", "21"],
      correctAnswerIndex: 2,
      explanation:
        "For five consecutive integers, the average is the middle value. The sequence is 16, 17, 18, 19, 20.",
    },
  ],
};

export function getMockTestConfig(exam: string) {
  const normalizedExam = exam.trim().toUpperCase();
  return MOCK_TEST_CONFIGS[normalizedExam] ?? null;
}

export function getFallbackMockQuestions(exam: string) {
  const config = getMockTestConfig(exam) ?? MOCK_TEST_CONFIGS.JEE;
  const seeds = FALLBACK_QUESTIONS[config.exam] ?? FALLBACK_QUESTIONS.JEE;
  const defaultMarks =
    config.exam === "CAT" ? 3 : config.exam === "UPSC" || config.exam === "GATE" ? 2 : 4;
  const defaultNegativeMarks =
    config.exam === "UPSC" || config.exam === "GATE"
      ? 0.67
      : config.exam === "CAT" || config.exam === "JEE" || config.exam === "NEET"
        ? 1
        : 0;

  return seeds.slice(0, config.mockQuestionCount).map((question, index) => ({
    ...question,
    id: `${config.exam.toLowerCase()}-mock-${index + 1}`,
    marks: question.marks ?? defaultMarks,
    negativeMarks: question.negativeMarks ?? defaultNegativeMarks,
  }));
}

export function normalizeMockQuestion(
  value: unknown,
  exam: string,
  index: number,
): MockQuestion | null {
  const config = getMockTestConfig(exam) ?? MOCK_TEST_CONFIGS.JEE;

  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<MockQuestion>;
  const question = String(item.question ?? "").trim();
  const options = Array.isArray(item.options)
    ? item.options.map(String).map((option) => option.trim()).filter(Boolean)
    : [];
  const explanation = String(item.explanation ?? "").trim();
  const section = String(item.section ?? config.sections[index % config.sections.length]).trim();
  const difficultyValue = String(item.difficulty ?? "High").trim();
  const correctAnswerIndex = Number(item.correctAnswerIndex);
  const marks = Number(item.marks);
  const negativeMarks = Number(item.negativeMarks);
  const difficulty: MockDifficulty =
    difficultyValue === "Advanced" || difficultyValue === "Exam-level"
      ? difficultyValue
      : "High";

  if (
    !question ||
    options.length !== 4 ||
    !Number.isInteger(correctAnswerIndex) ||
    correctAnswerIndex < 0 ||
    correctAnswerIndex > 3 ||
    !explanation
  ) {
    return null;
  }

  return {
    id: String(item.id ?? `${config.exam.toLowerCase()}-ai-mock-${index + 1}`),
    section,
    difficulty,
    question,
    options,
    correctAnswerIndex,
    explanation,
    marks: Number.isFinite(marks) && marks > 0 ? marks : getFallbackMockQuestions(config.exam)[0].marks,
    negativeMarks:
      Number.isFinite(negativeMarks) && negativeMarks >= 0
        ? negativeMarks
        : getFallbackMockQuestions(config.exam)[0].negativeMarks,
  };
}
