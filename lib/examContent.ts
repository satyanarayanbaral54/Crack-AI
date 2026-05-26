export type SyllabusTopic = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
};

export type SyllabusSection = {
  title: string;
  overview: string;
  topics: SyllabusTopic[];
};

export type ExamContent = {
  name: string;
  dashboardSummary: string;
  syllabusIntro: string;
  focusAreas: string[];
  sourceLabel: string;
  sourceHref: string;
  syllabusSections: SyllabusSection[];
};

export const examContent = {
  JEE: {
    name: "JEE",
    dashboardSummary:
      "JEE preparation is built on Physics, Chemistry, and Mathematics mastery. Focus on concept clarity, formula recall, timed problem solving, and repeated revision of Class 11 and 12 fundamentals.",
    syllabusIntro:
      "A focused JEE syllabus map for Paper 1 preparation across Physics, Chemistry, and Mathematics.",
    focusAreas: ["PCM mastery", "Numerical speed", "Concept revision"],
    sourceLabel: "NTA JEE Main syllabus",
    sourceHref: "https://jeemain.nta.nic.in/document/syllabus-2026/",
    syllabusSections: [
      {
        title: "Physics",
        overview:
          "Mechanics, heat, waves, electricity, magnetism, optics, and modern physics form the scoring base.",
        topics: [
          {
            id: "jee-physics-mechanics",
            title: "Mechanics",
            description:
              "Mechanics builds the language of force, motion, energy, rotation, gravity, and fluids. Strong free-body diagrams and conservation laws make this section highly scoring.",
            highlights: [
              "Units, dimensions, vectors, kinematics, laws of motion",
              "Work, energy, power, circular motion, rotation",
              "Gravitation, solids, fluids, elasticity",
            ],
          },
          {
            id: "jee-physics-thermal",
            title: "Thermal Physics",
            description:
              "Thermal physics connects temperature, heat transfer, gas laws, and thermodynamic processes. Practice graphs and process-based questions carefully.",
            highlights: [
              "Thermodynamics and kinetic theory",
              "Calorimetry and heat transfer",
              "Thermal properties of matter",
            ],
          },
          {
            id: "jee-physics-waves",
            title: "Oscillations and Waves",
            description:
              "This topic tests periodic motion, wave behavior, sound, resonance, and superposition. Formula clarity matters, but graph interpretation matters more.",
            highlights: [
              "Simple harmonic motion",
              "Wave motion and sound waves",
              "Resonance, beats, Doppler effect",
            ],
          },
          {
            id: "jee-physics-electromagnetism",
            title: "Electricity and Magnetism",
            description:
              "Electromagnetism is a major problem-solving area covering fields, circuits, magnetic effects, induction, and alternating current.",
            highlights: [
              "Electrostatics and capacitors",
              "Current electricity and circuits",
              "Magnetism, EMI, AC, electromagnetic waves",
            ],
          },
          {
            id: "jee-physics-optics-modern",
            title: "Optics and Modern Physics",
            description:
              "Optics and modern physics are often direct and concept-heavy. Ray diagrams, wave optics, atoms, nuclei, and semiconductors need crisp revision.",
            highlights: [
              "Ray optics and wave optics",
              "Dual nature, atoms, nuclei",
              "Semiconductors and experimental skills",
            ],
          },
        ],
      },
      {
        title: "Chemistry",
        overview:
          "Physical, inorganic, and organic chemistry need different study styles: calculation, memory, and mechanism practice.",
        topics: [
          {
            id: "jee-chemistry-physical",
            title: "Physical Chemistry",
            description:
              "Physical chemistry rewards accuracy in formulas, units, equilibrium logic, and numerical practice.",
            highlights: [
              "Mole concept, atomic structure, thermodynamics",
              "Chemical and ionic equilibrium",
              "Redox, electrochemistry, kinetics, solutions",
            ],
          },
          {
            id: "jee-chemistry-inorganic",
            title: "Inorganic Chemistry",
            description:
              "Inorganic chemistry needs periodic trends, bonding logic, coordination compounds, and NCERT-style factual command.",
            highlights: [
              "Periodic table and chemical bonding",
              "Coordination compounds",
              "s-block, p-block, d-block, f-block elements",
            ],
          },
          {
            id: "jee-chemistry-organic",
            title: "Organic Chemistry",
            description:
              "Organic chemistry becomes easier when reactions are studied through electronic effects and mechanisms instead of only memorization.",
            highlights: [
              "IUPAC, isomerism, GOC, hydrocarbons",
              "Haloalkanes, alcohols, phenols, ethers",
              "Carbonyls, carboxylic acids, amines, biomolecules",
            ],
          },
        ],
      },
      {
        title: "Mathematics",
        overview:
          "JEE Mathematics needs clean algebra, calculus fluency, geometry visualization, and timed mixed practice.",
        topics: [
          {
            id: "jee-math-algebra",
            title: "Algebra",
            description:
              "Algebra is the base for equation solving, sequence logic, counting, probability, and complex-number geometry.",
            highlights: [
              "Sets, relations, functions, complex numbers",
              "Quadratic equations, sequences, series",
              "Permutations, combinations, probability, statistics",
            ],
          },
          {
            id: "jee-math-calculus",
            title: "Calculus",
            description:
              "Calculus questions test limits, continuity, differentiation, integration, and application-based reasoning.",
            highlights: [
              "Limits, continuity, differentiability",
              "Definite and indefinite integration",
              "Differential equations and area under curves",
            ],
          },
          {
            id: "jee-math-geometry",
            title: "Coordinate Geometry",
            description:
              "Coordinate geometry is formula-rich but predictable when graphs, distances, slopes, and standard forms are practiced regularly.",
            highlights: [
              "Straight lines, circles, conics",
              "Three-dimensional geometry",
              "Vectors and trigonometry",
            ],
          },
        ],
      },
    ],
  },
  NEET: {
    name: "NEET",
    dashboardSummary:
      "NEET preparation depends on NCERT depth, Biology accuracy, and fast Physics-Chemistry application. Prioritize repeated reading, diagrams, chapter tests, and error analysis.",
    syllabusIntro:
      "A NEET syllabus map across Physics, Chemistry, Botany, and Zoology for medical entrance preparation.",
    focusAreas: ["NCERT command", "Biology recall", "Medical numericals"],
    sourceLabel: "NMC NEET UG syllabus",
    sourceHref: "https://www.nmc.org.in/neet/neet-ug/finalcoresyllabus_neet-ug/",
    syllabusSections: [
      {
        title: "Physics",
        overview:
          "Physics questions usually test fundamentals, formulas, graphs, and medical entrance level numerical application.",
        topics: [
          {
            id: "neet-physics-mechanics",
            title: "Mechanics",
            description:
              "Mechanics covers the laws of motion and physical systems. Build comfort with diagrams, units, and one-step to multi-step numerical questions.",
            highlights: [
              "Physical world, units, motion, laws of motion",
              "Work, energy, power, rotation, gravitation",
              "Properties of solids and fluids",
            ],
          },
          {
            id: "neet-physics-thermal-waves",
            title: "Heat, Waves and Thermodynamics",
            description:
              "This area links heat, gas behavior, oscillations, and waves. Revision should include formulas plus common NCERT examples.",
            highlights: [
              "Thermal properties and thermodynamics",
              "Kinetic theory",
              "Oscillations and waves",
            ],
          },
          {
            id: "neet-physics-electricity",
            title: "Electricity and Magnetism",
            description:
              "Current electricity, fields, magnetism, and induction are high-value chapters that reward regular numerical practice.",
            highlights: [
              "Electrostatics and current electricity",
              "Moving charges and magnetism",
              "EMI, AC, electromagnetic waves",
            ],
          },
          {
            id: "neet-physics-optics-modern",
            title: "Optics and Modern Physics",
            description:
              "Optics and modern physics often include direct formula and concept questions, so revise diagrams and definitions frequently.",
            highlights: [
              "Ray optics and wave optics",
              "Dual nature, atoms, nuclei",
              "Semiconductor electronics",
            ],
          },
        ],
      },
      {
        title: "Chemistry",
        overview:
          "Chemistry combines numerical accuracy, NCERT facts, periodic logic, and reaction-based understanding.",
        topics: [
          {
            id: "neet-chemistry-physical",
            title: "Physical Chemistry",
            description:
              "Physical chemistry asks for clear formulas and careful calculation. Keep a dedicated formula notebook for revision.",
            highlights: [
              "Basic concepts, atomic structure, states of matter",
              "Thermodynamics, equilibrium, redox",
              "Solutions, electrochemistry, kinetics",
            ],
          },
          {
            id: "neet-chemistry-inorganic",
            title: "Inorganic Chemistry",
            description:
              "Inorganic chemistry is highly NCERT-driven. Tables, trends, exceptions, and named compounds need repeated revision.",
            highlights: [
              "Periodic classification and bonding",
              "Hydrogen, s-block, p-block elements",
              "Coordination compounds, d-block, f-block",
            ],
          },
          {
            id: "neet-chemistry-organic",
            title: "Organic Chemistry",
            description:
              "Organic chemistry needs mechanism clarity, reagent memory, and consistent reaction revision.",
            highlights: [
              "GOC, isomerism, hydrocarbons",
              "Haloalkanes, alcohols, phenols, ethers",
              "Aldehydes, ketones, acids, amines, biomolecules",
            ],
          },
        ],
      },
      {
        title: "Biology",
        overview:
          "Biology carries major weight in NEET. NCERT diagrams, keywords, examples, and line-by-line revision are essential.",
        topics: [
          {
            id: "neet-biology-cell-diversity",
            title: "Diversity, Cell and Structure",
            description:
              "This area covers living-world classification, plant and animal tissues, cell structure, and biomolecules.",
            highlights: [
              "Diversity in living world",
              "Structural organization in plants and animals",
              "Cell biology, biomolecules, cell cycle",
            ],
          },
          {
            id: "neet-biology-physiology",
            title: "Plant and Human Physiology",
            description:
              "Physiology needs process clarity. Use flowcharts for transport, photosynthesis, respiration, digestion, circulation, and hormones.",
            highlights: [
              "Plant physiology and mineral nutrition",
              "Human digestion, breathing, circulation, excretion",
              "Neural control, chemical coordination, movement",
            ],
          },
          {
            id: "neet-biology-genetics",
            title: "Reproduction, Genetics and Evolution",
            description:
              "This is a high-yield Biology zone. Practice genetic crosses and revise molecular biology definitions precisely.",
            highlights: [
              "Reproduction in organisms, plants, and humans",
              "Inheritance and molecular basis",
              "Evolution and human health",
            ],
          },
          {
            id: "neet-biology-biotech-ecology",
            title: "Biotechnology and Ecology",
            description:
              "Biotech and ecology are concept-rich and often direct. Learn applications, examples, cycles, and environmental terms.",
            highlights: [
              "Biotechnology principles and applications",
              "Organisms and populations",
              "Ecosystem, biodiversity, environmental issues",
            ],
          },
        ],
      },
    ],
  },
  UPSC: {
    name: "UPSC",
    dashboardSummary:
      "UPSC is a layered civil services journey. Build command over current affairs, polity, economy, history, geography, environment, ethics, answer writing, and interview-ready thinking.",
    syllabusIntro:
      "A UPSC Civil Services syllabus map covering Prelims, Mains, Essay, Optional, and Personality Test preparation.",
    focusAreas: ["Current affairs", "Answer writing", "Governance mindset"],
    sourceLabel: "UPSC CSE notification",
    sourceHref: "https://upsc.gov.in/sites/default/files/Notif-CSP-2025-Engl-220125.pdf",
    syllabusSections: [
      {
        title: "Prelims",
        overview:
          "Prelims screens candidates through General Studies Paper I and the qualifying CSAT paper.",
        topics: [
          {
            id: "upsc-prelims-gs",
            title: "General Studies Paper I",
            description:
              "GS Paper I checks breadth across national and international awareness, static subjects, and applied current affairs.",
            highlights: [
              "Current events of national and international importance",
              "History, culture, geography, polity, economy",
              "Environment, biodiversity, climate change, general science",
            ],
          },
          {
            id: "upsc-prelims-csat",
            title: "CSAT Paper II",
            description:
              "CSAT is qualifying, but it needs consistent practice in comprehension, reasoning, data interpretation, and basic numeracy.",
            highlights: [
              "Comprehension and interpersonal skills",
              "Logical reasoning and analytical ability",
              "Decision making, data interpretation, basic numeracy",
            ],
          },
        ],
      },
      {
        title: "Mains General Studies",
        overview:
          "Mains rewards structured thinking, multidimensional analysis, examples, and concise answer writing.",
        topics: [
          {
            id: "upsc-mains-gs1",
            title: "GS Paper I",
            description:
              "GS I covers Indian heritage, culture, history, society, and geography. Use maps, timelines, and social examples.",
            highlights: [
              "Indian culture and modern Indian history",
              "World history and post-independence consolidation",
              "Indian society and world/Indian geography",
            ],
          },
          {
            id: "upsc-mains-gs2",
            title: "GS Paper II",
            description:
              "GS II focuses on Constitution, governance, welfare, social justice, and international relations.",
            highlights: [
              "Constitution, Parliament, judiciary, federalism",
              "Governance, transparency, welfare schemes",
              "India and its neighbourhood, global institutions",
            ],
          },
          {
            id: "upsc-mains-gs3",
            title: "GS Paper III",
            description:
              "GS III tests economy, technology, environment, security, and disaster management with current examples.",
            highlights: [
              "Indian economy, agriculture, infrastructure",
              "Science and technology, environment, disaster management",
              "Internal security and border management",
            ],
          },
          {
            id: "upsc-mains-gs4",
            title: "GS Paper IV",
            description:
              "Ethics paper needs definitions, thinkers, case-study structure, emotional intelligence, and public-service values.",
            highlights: [
              "Ethics, integrity, aptitude, attitude",
              "Emotional intelligence and moral thinkers",
              "Probity in governance and case studies",
            ],
          },
        ],
      },
      {
        title: "Essay, Optional and Interview",
        overview:
          "The final stage needs personality, depth, clarity, and the ability to connect facts with judgement.",
        topics: [
          {
            id: "upsc-essay",
            title: "Essay Paper",
            description:
              "Essay preparation builds argument structure, examples, philosophical balance, and coherent introductions and conclusions.",
            highlights: [
              "Social, political, economic, ethical, and abstract themes",
              "Structured argument and balanced analysis",
              "Examples, quotes, data, and conclusion craft",
            ],
          },
          {
            id: "upsc-optional",
            title: "Optional Subject",
            description:
              "Optional papers require deep subject mastery, previous-year trend analysis, and presentation aligned with UPSC demand.",
            highlights: [
              "Two papers from one chosen optional subject",
              "Conceptual depth and answer-writing practice",
              "PYQ mapping and topic-wise notes",
            ],
          },
          {
            id: "upsc-interview",
            title: "Personality Test",
            description:
              "The interview evaluates awareness, judgement, confidence, honesty, and administrative temperament.",
            highlights: [
              "DAF-based preparation",
              "Current affairs with balanced opinions",
              "Communication, composure, and ethical clarity",
            ],
          },
        ],
      },
    ],
  },
  GATE: {
    name: "GATE",
    dashboardSummary:
      "GATE preparation turns undergraduate engineering knowledge into precise problem solving. Balance General Aptitude, Engineering Mathematics, and your selected paper's core technical subjects.",
    syllabusIntro:
      "A GATE syllabus map for common preparation areas. The exact core subject depends on the selected GATE paper.",
    focusAreas: ["Aptitude", "Engineering math", "Core technical depth"],
    sourceLabel: "GATE 2026 papers and syllabus",
    sourceHref: "https://gate2026.iitg.ac.in/exam-papers-and-syllabus.html",
    syllabusSections: [
      {
        title: "Common Sections",
        overview:
          "General Aptitude is common to all papers, while Engineering Mathematics appears in many engineering papers.",
        topics: [
          {
            id: "gate-general-aptitude",
            title: "General Aptitude",
            description:
              "General Aptitude tests language, reasoning, and numerical ability. It is compact but can strongly improve total score.",
            highlights: [
              "Verbal ability and English grammar",
              "Numerical ability and data interpretation",
              "Reasoning, logic, and spatial aptitude",
            ],
          },
          {
            id: "gate-engineering-math",
            title: "Engineering Mathematics",
            description:
              "Engineering Mathematics supports technical problem solving and usually includes linear algebra, calculus, probability, and differential equations.",
            highlights: [
              "Linear algebra, calculus, differential equations",
              "Probability, statistics, numerical methods",
              "Discrete mathematics for CS-oriented papers",
            ],
          },
        ],
      },
      {
        title: "Core Engineering",
        overview:
          "The core syllabus changes by GATE paper, so this section organizes the usual technical preparation approach.",
        topics: [
          {
            id: "gate-core-concepts",
            title: "Core Subject Concepts",
            description:
              "Your selected paper's core subjects need textbook-level clarity, short notes, formula revision, and PYQ mapping.",
            highlights: [
              "Paper-specific theory from undergraduate curriculum",
              "Definitions, laws, theorems, and standard models",
              "Previous-year question patterns",
            ],
          },
          {
            id: "gate-analysis-design",
            title: "Analysis and Design Problems",
            description:
              "GATE often asks candidates to analyze systems, circuits, structures, algorithms, or processes depending on the paper.",
            highlights: [
              "Model building and assumptions",
              "Stepwise derivations and numerical accuracy",
              "Interpretation of graphs, tables, and diagrams",
            ],
          },
          {
            id: "gate-nat-msq",
            title: "NAT, MCQ and MSQ Practice",
            description:
              "Question format matters. NAT needs exact numerical work, MCQs need option strategy, and MSQs need careful concept validation.",
            highlights: [
              "Numerical Answer Type accuracy",
              "Multiple Choice elimination strategy",
              "Multiple Select conceptual completeness",
            ],
          },
        ],
      },
      {
        title: "Revision Plan",
        overview:
          "A strong GATE plan uses revision cycles, formula sheets, and full-length tests to improve accuracy.",
        topics: [
          {
            id: "gate-formula-revision",
            title: "Formula and Short Notes",
            description:
              "Formula sheets and short notes compress large technical subjects into revision-friendly material before mock tests.",
            highlights: [
              "Topic-wise formulas",
              "Common mistakes and assumptions",
              "One-page revision sheets",
            ],
          },
          {
            id: "gate-mock-analysis",
            title: "Mock Test Analysis",
            description:
              "Mock analysis converts practice into score improvement by identifying weak topics, slow calculations, and avoidable errors.",
            highlights: [
              "Accuracy and time tracking",
              "Error log maintenance",
              "Revision based on weak areas",
            ],
          },
        ],
      },
    ],
  },
  CAT: {
    name: "CAT",
    dashboardSummary:
      "CAT is a speed, judgement, and accuracy exam across VARC, DILR, and Quant. Build reading stamina, puzzle selection skill, arithmetic strength, and calm time management.",
    syllabusIntro:
      "A CAT syllabus map across Verbal Ability, Reading Comprehension, Data Interpretation, Logical Reasoning, and Quantitative Aptitude.",
    focusAreas: ["Reading stamina", "Set selection", "Quant accuracy"],
    sourceLabel: "CAT official mock navigation",
    sourceHref: "https://iimcat.ac.in/per/g01/pub/756/ASM/WebPortal/1/PDF/Mock_Test_Navigation_Guideline.pdf",
    syllabusSections: [
      {
        title: "VARC",
        overview:
          "VARC checks reading comprehension, inference, language structure, and verbal reasoning.",
        topics: [
          {
            id: "cat-reading-comprehension",
            title: "Reading Comprehension",
            description:
              "Reading Comprehension is about understanding argument flow, tone, inference, and main idea under time pressure.",
            highlights: [
              "Main idea, tone, inference, central argument",
              "Author viewpoint and strengthen/weaken logic",
              "Passage selection and question prioritization",
            ],
          },
          {
            id: "cat-verbal-ability",
            title: "Verbal Ability",
            description:
              "Verbal Ability tests paragraph logic and sentence-level coherence rather than grammar memorization alone.",
            highlights: [
              "Para jumbles and odd sentence out",
              "Para summary and completion",
              "Critical reasoning basics",
            ],
          },
        ],
      },
      {
        title: "DILR",
        overview:
          "DILR rewards calm set selection, clean table making, and multi-condition reasoning.",
        topics: [
          {
            id: "cat-data-interpretation",
            title: "Data Interpretation",
            description:
              "DI questions present data through charts, tables, caselets, and mixed formats. Accuracy comes from organized calculations.",
            highlights: [
              "Tables, bar graphs, line graphs, pie charts",
              "Percentages, ratios, averages, growth",
              "Caselet-based calculations",
            ],
          },
          {
            id: "cat-logical-reasoning",
            title: "Logical Reasoning",
            description:
              "LR tests arrangements, grouping, scheduling, routes, games, and constraint-based thinking.",
            highlights: [
              "Seating arrangements and team selection",
              "Games, tournaments, routes, networks",
              "Venn diagrams, cubes, clocks, calendars",
            ],
          },
        ],
      },
      {
        title: "Quantitative Aptitude",
        overview:
          "Quant needs arithmetic strength, algebraic control, geometry visualization, and smart approximation.",
        topics: [
          {
            id: "cat-quant-arithmetic",
            title: "Arithmetic",
            description:
              "Arithmetic is central to CAT Quant and DI. Master percentages, ratios, time-work, and profit-loss deeply.",
            highlights: [
              "Percentages, ratio, proportion, averages",
              "Profit and loss, SI-CI, mixtures",
              "Time and work, time-speed-distance",
            ],
          },
          {
            id: "cat-quant-algebra",
            title: "Algebra and Numbers",
            description:
              "Algebra and number systems test equation handling, inequalities, sequences, remainders, and factor logic.",
            highlights: [
              "Linear and quadratic equations",
              "Inequalities, functions, progressions",
              "Number system, divisibility, remainders",
            ],
          },
          {
            id: "cat-quant-geometry",
            title: "Geometry and Modern Math",
            description:
              "Geometry and modern math are scoring when formulas, diagrams, and cases are handled carefully.",
            highlights: [
              "Triangles, circles, quadrilaterals, mensuration",
              "Coordinate geometry",
              "Permutation, combination, probability, set theory",
            ],
          },
        ],
      },
    ],
  },
} satisfies Record<string, ExamContent>;

export type ExamName = keyof typeof examContent;

export function getExamContent(exam: string): ExamContent | null {
  const normalizedExam = exam.trim().toUpperCase() as ExamName;

  return examContent[normalizedExam] ?? null;
}
