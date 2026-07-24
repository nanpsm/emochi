"use client";

import { useState } from "react";
import Image from "next/image";
import { QUIZ_QUESTIONS, computeQuizResults } from "@/lib/quiz-questions";
import { CHARACTERS, computeEmochiScores } from "@/lib/emochi-scores";

const TOTAL = QUIZ_QUESTIONS.length;

// 0-100 score -> 0-10 level (score 50-59 = level 5, 100 = level 10)
function scoreToLevel(score) {
  return Math.min(10, Math.floor(score / 10));
}

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

function EmochiRing({ name, color, tint, score, level, isTop }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  // ring fill reflects progress within the level (score's ones digit out of 10),
  // e.g. score 56 -> level 5, ring shows 6/10 filled
  const progressWithinLevel = score % 10;
  const offset = circumference * (1 - progressWithinLevel / 10);

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="relative h-28 w-28 sm:h-40 sm:w-40">
        {isTop && (
          <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 text-2xl sm:text-3xl">
            👑
          </span>
        )}
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={radius} strokeWidth="7" fill="none" stroke="#F1F1F1" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            strokeWidth="7"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full sm:h-24 sm:w-24"
            style={{ backgroundColor: tint }}
          >
            <Image
              src={`/agents/${name}.png`}
              alt={name}
              width={64}
              height={64}
              className="mix-blend-multiply"
            />
          </div>
        </div>
        <span
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold text-white shadow-sm sm:px-3.5 sm:py-1.5 sm:text-base"
          style={{ backgroundColor: color }}
        >
          Lv {level}
        </span>
      </div>
      <span className="mt-4 text-sm font-bold text-zinc-600 sm:text-lg">{name}</span>
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
  const scores = computeEmochiScores(result);
  const leaderboard = Object.entries(scores)
    .map(([role, score]) => ({ role, score, ...CHARACTERS[role] }))
    .sort((a, b) => b.score - a.score);
  const topScore = leaderboard[0]?.score;

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 font-[family-name:var(--font-baloo)] sm:py-16"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, #FFF3D3 0%, transparent 45%), radial-gradient(circle at 80% 90%, #DCEBFB 0%, transparent 45%), #FFF8EC",
      }}
    >
      <div className="animate-pop-in w-full max-w-6xl text-center">
        <div className="mt-2">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-zinc-800 sm:text-4xl">
            Meet Your Emochi Squad
          </h2>
          <div className="mt-6 flex flex-wrap items-start justify-center gap-x-6 gap-y-10 sm:gap-x-10">
            {leaderboard.map(({ role, score, name, color, tint }) => (
              <EmochiRing
                key={role}
                name={name}
                color={color}
                tint={tint}
                score={score}
                level={scoreToLevel(score)}
                isTop={score === topScore}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
