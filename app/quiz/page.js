"use client";

import { useState } from "react";
import Image from "next/image";
import { QUIZ_QUESTIONS, computeQuizResults } from "@/lib/quiz-questions";
import { CHARACTERS, computeEmochiScores } from "@/lib/emochi-scores";

const TOTAL = QUIZ_QUESTIONS.length;

const MASCOTS = {
  "I/E": { name: "Bubble", color: "#F97316", tint: "#FFEDD9" },
  "S/N": { name: "Wisey", color: "#C9A857", tint: "#FBF3D9" },
  "T/F": { name: "Tear", color: "#4A90D9", tint: "#DCEBFB" },
  "J/P": { name: "Zen", color: "#5FD4C4", tint: "#DFF9F4" },
  sleep: { name: "Dozy", color: "#6C7A96", tint: "#E4E8F2" },
  stress: { name: "Buzzy", color: "#FF6B4A", tint: "#FFE4DC" },
  socialTime: { name: "Cheer", color: "#FFC53D", tint: "#FFF3D3" },
};

const CHEER_LINES = [
  "Ooh, love that answer!",
  "Nice pick! On to the next one.",
  "Great, noted!",
  "Yes! Learning more about you.",
  "Got it, moving along!",
];

const RESULT_LABELS = {
  sleep: {
    lt5: "Less than 5 hours",
    "5to6": "5–6 hours",
    "7to9": "7–9 hours",
    gt9: "More than 9 hours",
  },
  stress: {
    very_relaxed: "Very relaxed",
    slightly_stressful: "Slightly stressful",
    quite_stressful: "Quite stressful",
    extremely_stressful: "Extremely stressful",
  },
  socialTime: {
    rarely: "Rarely",
    sometimes: "Sometimes",
    often: "Often",
    very_often: "Very often",
  },
};

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);

  const question = QUIZ_QUESTIONS[step];
  const mascot = MASCOTS[question?.dimension];
  const selectedValue = answers[question?.id];
  const isLastQuestion = step === TOTAL - 1;

  function selectOption(value) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setBounceKey((k) => k + 1);
  }

  function goNext() {
    if (isLastQuestion) {
      const result = computeQuizResults(answers);
      try {
        localStorage.setItem("emochi_quiz_result", JSON.stringify(result));
      } catch {}
      setSubmitted(true);
    } else {
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function retake() {
    setAnswers({});
    setStep(0);
    setSubmitted(false);
  }

  if (submitted) {
    return <QuizResults result={computeQuizResults(answers)} onRetake={retake} />;
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center overflow-hidden px-4 py-8 font-[family-name:var(--font-baloo)] sm:py-12"
      style={{
        background:
          "radial-gradient(circle at 15% 0%, #FFF3D3 0%, transparent 45%), radial-gradient(circle at 85% 100%, #DCEBFB 0%, transparent 45%), #FFF8EC",
      }}
    >
      <div className="w-full max-w-lg">
        <MochiProgress step={step} total={TOTAL} color={mascot.color} />

        <div
          key={question.id}
          className="animate-pop-in mt-6 rounded-[2rem] bg-white p-6 shadow-[0_8px_0_0_rgba(0,0,0,0.06)] sm:p-8"
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="animate-float-bob relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{ background: mascot.tint }}
            >
              <Image
                src={`/agents/${mascot.name}.png`}
                alt={mascot.name}
                width={96}
                height={96}
                className="mix-blend-multiply"
                priority
              />
            </div>

            <span
              className="mt-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: mascot.color }}
            >
              {mascot.name} asks
            </span>

            <h1 className="mt-3 text-xl font-bold leading-snug text-zinc-800 sm:text-2xl">
              {question.prompt}
            </h1>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {question.options.map((option, i) => {
              const isSelected = selectedValue === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option.value)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border-[3px] px-4 py-4 text-left text-base font-semibold transition-all active:scale-[0.98] ${
                    isSelected
                      ? "scale-[1.02] border-current shadow-md"
                      : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:border-zinc-200 hover:bg-white"
                  }`}
                  style={
                    isSelected
                      ? { color: mascot.color, backgroundColor: mascot.tint }
                      : undefined
                  }
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                      isSelected ? "text-white" : "bg-zinc-200 text-zinc-400"
                    }`}
                    style={isSelected ? { backgroundColor: mascot.color } : undefined}
                  >
                    {isSelected ? "✓" : String.fromCharCode(65 + i)}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>

          {selectedValue && (
            <p
              key={bounceKey}
              className="animate-pop-in mt-4 text-center text-sm font-semibold"
              style={{ color: mascot.color }}
            >
              {CHEER_LINES[bounceKey % CHEER_LINES.length]}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-full px-5 py-2 text-sm font-bold text-zinc-400 transition-opacity hover:text-zinc-600 disabled:opacity-0"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!selectedValue}
            className="rounded-full px-7 py-3 text-sm font-bold text-white shadow-[0_5px_0_0_rgba(0,0,0,0.15)] transition-all enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
            style={{ backgroundColor: mascot.color }}
          >
            {isLastQuestion ? "See my results ✨" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MochiProgress({ step, total, color }) {
  const percent = Math.round(((step + 1) / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          🍡 {step + 1} / {total}
        </span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">{percent}%</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function QuizResults({ result, onRetake }) {
  const lifestyleChips = [
    { emoji: "🛌", label: "Sleep", value: RESULT_LABELS.sleep[result.sleep], mascot: MASCOTS.sleep },
    { emoji: "😅", label: "Stress level", value: RESULT_LABELS.stress[result.stress], mascot: MASCOTS.stress },
    {
      emoji: "🫂",
      label: "Time with friends/family",
      value: RESULT_LABELS.socialTime[result.socialTime],
      mascot: MASCOTS.socialTime,
    },
  ];

  const scores = computeEmochiScores(result);
  const leaderboard = Object.entries(scores)
    .map(([role, score]) => ({ role, score, ...CHARACTERS[role] }))
    .sort((a, b) => b.score - a.score);
  const topScore = leaderboard[0]?.score;

  return (
    <div
      className="flex min-h-screen flex-col items-center px-4 py-12 font-[family-name:var(--font-baloo)] sm:py-16"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, #FFF3D3 0%, transparent 45%), radial-gradient(circle at 80% 90%, #DCEBFB 0%, transparent 45%), #FFF8EC",
      }}
    >
      <div className="animate-pop-in w-full max-w-lg text-center">
        <p className="text-4xl">🎉</p>
        <p className="mt-1 text-sm font-bold uppercase tracking-widest text-[#C9A857]">
          Achievement unlocked
        </p>

        <div className="mt-4 inline-block rounded-[2rem] bg-white px-10 py-6 shadow-[0_8px_0_0_rgba(0,0,0,0.06)]">
          <h1 className="bg-gradient-to-r from-[#FFC53D] via-[#FF6B4A] to-[#4A90D9] bg-clip-text text-6xl font-extrabold tracking-tight text-transparent">
            {result.mbti}
          </h1>
        </div>

        <div className="mt-8">
          <p className="text-left text-sm font-bold uppercase tracking-wide text-zinc-400">
            Your Emochi Squad
          </p>
          <div className="mt-3 rounded-[2rem] bg-white p-5 pb-4 shadow-sm">
            <div className="flex items-end justify-between gap-1.5 sm:gap-3">
              {leaderboard.map(({ role, score, color }) => (
                <div key={role} className="flex flex-1 flex-col items-center">
                  <div className="relative w-full" style={{ height: 160 }}>
                    <span
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-extrabold"
                      style={{ bottom: `calc(${score}% + 6px)`, color }}
                    >
                      {score === topScore ? "👑 " : ""}
                      {score}
                    </span>
                    <div
                      className="absolute bottom-0 mx-auto w-7 rounded-t-lg transition-all duration-500 sm:w-9"
                      style={{
                        left: "50%",
                        transform: "translateX(-50%)",
                        height: `${score}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px w-full bg-zinc-100" />

            <div className="mt-3 flex justify-between gap-1.5 sm:gap-3">
              {leaderboard.map(({ role, name, tint }) => (
                <div key={role} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10"
                    style={{ backgroundColor: tint }}
                  >
                    <Image
                      src={`/agents/${name}.png`}
                      alt={name}
                      width={30}
                      height={30}
                      className="mix-blend-multiply"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 sm:text-[11px]">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {lifestyleChips.map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 text-left shadow-sm"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: chip.mascot.tint }}
              >
                {chip.emoji}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-zinc-400">{chip.label}</p>
                <p className="text-sm font-bold text-zinc-700">{chip.value}</p>
              </div>
              <Image
                src={`/agents/${chip.mascot.name}.png`}
                alt={chip.mascot.name}
                width={36}
                height={36}
                className="mix-blend-multiply"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onRetake}
          className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-500 shadow-[0_4px_0_0_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:text-zinc-700"
        >
          🔄 Retake quiz
        </button>
      </div>
    </div>
  );
}
