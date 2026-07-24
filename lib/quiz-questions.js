// 23-question onboarding quiz: Q1-20 score MBTI dimensions (I/E, S/N, T/F, J/P),
// Q21-23 capture lifestyle signals (sleep, stress, social time).
// Option `value` codes match the score-mapping tables in docs/notion-export/hackxperience.md.

export const QUIZ_QUESTIONS = [
  // Part A — Energy (I/E)
  {
    id: 1,
    part: "Energy",
    dimension: "I/E",
    prompt: "After a busy week, how do you prefer to recharge?",
    options: [
      { label: "Spend time alone", value: "I" },
      { label: "Spend time with friends", value: "E" },
    ],
  },
  {
    id: 2,
    part: "Energy",
    dimension: "I/E",
    prompt: "During group discussions, you usually...",
    options: [
      { label: "Listen before speaking", value: "I" },
      { label: "Speak as ideas come", value: "E" },
    ],
  },
  {
    id: 3,
    part: "Energy",
    dimension: "I/E",
    prompt: "At a social event, you tend to...",
    options: [
      { label: "Talk with a few people deeply", value: "I" },
      { label: "Meet lots of different people", value: "E" },
    ],
  },
  {
    id: 4,
    part: "Energy",
    dimension: "I/E",
    prompt: "When solving a difficult problem, you prefer to...",
    options: [
      { label: "Think quietly first", value: "I" },
      { label: "Discuss it with others", value: "E" },
    ],
  },
  {
    id: 5,
    part: "Energy",
    dimension: "I/E",
    prompt: "Which activity sounds more enjoyable?",
    options: [
      { label: "Spend quiet time by yourself", value: "I" },
      { label: "Spend time with friends or family", value: "E" },
    ],
  },

  // Part B — Information (S/N)
  {
    id: 6,
    part: "Information",
    dimension: "S/N",
    prompt: "When learning something new, you prefer...",
    options: [
      { label: "Practical examples", value: "S" },
      { label: "Big-picture ideas", value: "N" },
    ],
  },
  {
    id: 7,
    part: "Information",
    dimension: "S/N",
    prompt: "You usually notice...",
    options: [
      { label: "Facts and details", value: "S" },
      { label: "Patterns and possibilities", value: "N" },
    ],
  },
  {
    id: 8,
    part: "Information",
    dimension: "S/N",
    prompt: "During brainstorming, you...",
    options: [
      { label: "Focus on realistic ideas", value: "S" },
      { label: "Think of creative possibilities", value: "N" },
    ],
  },
  {
    id: 9,
    part: "Information",
    dimension: "S/N",
    prompt: "You trust more...",
    options: [
      { label: "Facts and past experience", value: "S" },
      { label: "Gut feelings and possibilities", value: "N" },
    ],
  },
  {
    id: 10,
    part: "Information",
    dimension: "S/N",
    prompt: "You prefer...",
    options: [
      { label: "Proven methods", value: "S" },
      { label: "Trying something different", value: "N" },
    ],
  },

  // Part C — Decision (T/F)
  {
    id: 11,
    part: "Decision",
    dimension: "T/F",
    prompt: "When making decisions, you usually...",
    options: [
      { label: "Focus on logic", value: "T" },
      { label: "Consider feelings", value: "F" },
    ],
  },
  {
    id: 12,
    part: "Decision",
    dimension: "T/F",
    prompt: "A friend asks for advice. You first...",
    options: [
      { label: "Offer solutions", value: "T" },
      { label: "Listen and comfort them", value: "F" },
    ],
  },
  {
    id: 13,
    part: "Decision",
    dimension: "T/F",
    prompt: "Which is more important?",
    options: [
      { label: "Fairness", value: "T" },
      { label: "Harmony", value: "F" },
    ],
  },
  {
    id: 14,
    part: "Decision",
    dimension: "T/F",
    prompt: "In disagreements, you...",
    options: [
      { label: "Discuss facts", value: "T" },
      { label: "Consider everyone's emotions", value: "F" },
    ],
  },
  {
    id: 15,
    part: "Decision",
    dimension: "T/F",
    prompt: "People describe you as...",
    options: [
      { label: "Objective", value: "T" },
      { label: "Compassionate", value: "F" },
    ],
  },

  // Part D — Lifestyle (J/P)
  {
    id: 16,
    part: "Lifestyle",
    dimension: "J/P",
    prompt: "Your daily schedule is usually...",
    options: [
      { label: "Planned", value: "J" },
      { label: "Flexible", value: "P" },
    ],
  },
  {
    id: 17,
    part: "Lifestyle",
    dimension: "J/P",
    prompt: "Before a trip, you...",
    options: [
      { label: "Plan everything", value: "J" },
      { label: "Decide along the way", value: "P" },
    ],
  },
  {
    id: 18,
    part: "Lifestyle",
    dimension: "J/P",
    prompt: "When given a deadline, you usually...",
    options: [
      { label: "Finish well before it", value: "J" },
      { label: "Finish close to the deadline", value: "P" },
    ],
  },
  {
    id: 19,
    part: "Lifestyle",
    dimension: "J/P",
    prompt: "When working on a project, you prefer to...",
    options: [
      { label: "Finish tasks one by one", value: "J" },
      { label: "Work on different tasks as inspiration comes", value: "P" },
    ],
  },
  {
    id: 20,
    part: "Lifestyle",
    dimension: "J/P",
    prompt: "You prefer...",
    options: [
      { label: "A clear plan", value: "J" },
      { label: "Keeping options open", value: "P" },
    ],
  },

  // Lifestyle signals — not MBTI, feed the daily/lifestyle score mapping instead
  {
    id: 21,
    part: "Lifestyle Signals",
    dimension: "sleep",
    prompt: "On most days, how many hours do you sleep?",
    options: [
      { label: "Less than 5 hours", value: "lt5" },
      { label: "5–6 hours", value: "5to6" },
      { label: "7–9 hours", value: "7to9" },
      { label: "More than 9 hours", value: "gt9" },
    ],
  },
  {
    id: 22,
    part: "Lifestyle Signals",
    dimension: "stress",
    prompt: "How stressful has your life been recently?",
    options: [
      { label: "Very relaxed", value: "very_relaxed" },
      { label: "Slightly stressful", value: "slightly_stressful" },
      { label: "Quite stressful", value: "quite_stressful" },
      { label: "Extremely stressful", value: "extremely_stressful" },
    ],
  },
  {
    id: 23,
    part: "Lifestyle Signals",
    dimension: "socialTime",
    prompt: "How often do you spend quality time with friends or family?",
    options: [
      { label: "Rarely", value: "rarely" },
      { label: "Sometimes", value: "sometimes" },
      { label: "Often", value: "often" },
      { label: "Very often", value: "very_often" },
    ],
  },
];

const MBTI_DIMENSIONS = [
  ["I", "E"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
];

export function computeQuizResults(answers) {
  const traitCounts = { I: 0, E: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (const question of QUIZ_QUESTIONS) {
    if (question.id > 20) continue;
    const value = answers[question.id];
    if (value) traitCounts[value] += 1;
  }

  const mbti = MBTI_DIMENSIONS.map(([a, b]) =>
    traitCounts[a] >= traitCounts[b] ? a : b
  ).join("");

  return {
    mbti,
    traitCounts,
    sleep: answers[21] ?? null,
    stress: answers[22] ?? null,
    socialTime: answers[23] ?? null,
  };
}
