"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QUIZ_QUESTIONS, computeQuizResults } from "@/lib/quiz-questions";
import { CHARACTERS, computeEmochiScores } from "@/lib/emochi-scores";

const TOTAL = QUIZ_QUESTIONS.length;

// 0-100 score -> 0-10 level (score 50-59 = level 5, 100 = level 10)
function scoreToLevel(score) {
  return Math.min(10, Math.floor(score / 10));
}

// All 8 Emochi, cycled one-per-question (question 9 restarts the rotation)
const MASCOT_ROTATION = [
  { name: "Cheer", color: "#FFC53D", tint: "#FFF3D3" },
  { name: "Fear", color: "#A78BFA", tint: "#EDE6FE" },
  { name: "Buzzy", color: "#FF6B4A", tint: "#FFE4DC" },
  { name: "Tear", color: "#4A90D9", tint: "#DCEBFB" },
  { name: "Zen", color: "#5FD4C4", tint: "#DFF9F4" },
  { name: "Bubble", color: "#F97316", tint: "#FFEDD9" },
  { name: "Dozy", color: "#6C7A96", tint: "#E4E8F2" },
  { name: "Wisey", color: "#C9A857", tint: "#FBF3D9" },
];

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
  const mascot = MASCOT_ROTATION[step % MASCOT_ROTATION.length];
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
          "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
      }}
    >
      <div className="w-full max-w-2xl">
        <MochiProgress step={step} total={TOTAL} color={mascot.color} />

        <div
          key={question.id}
          className="animate-pop-in mt-6 rounded-[2rem] bg-white p-6 shadow-[0_8px_0_0_rgba(0,0,0,0.06)] sm:p-9"
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="animate-float-bob relative flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
              style={{ background: mascot.tint }}
            >
              <Image
                src={`/idle/${mascot.name.toLowerCase()}.png`}
                alt={mascot.name}
                width={84}
                height={84}
                className="mix-blend-multiply sm:h-[100px] sm:w-[100px]"
                priority
              />
            </div>

            <span
              className="mt-3 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-white sm:text-sm"
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
                  className={`group flex w-full items-center gap-3 rounded-2xl border-[3px] px-5 py-4 text-left text-base font-semibold transition-all active:scale-[0.98] ${
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

function PodiumBar({ name, color, tint, score, level, rank, barHeight }) {
  const isTop = rank === 0;

  return (
    <div className="flex flex-col items-center">
      {/* Rank label */}
      <span className="mb-1 text-[10px] font-bold text-zinc-400 sm:text-xs">
        #{rank + 1}
      </span>

      {/* Avatar */}
      <div className="relative mb-1">
        {isTop && (
          <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 text-lg sm:text-xl">
            👑
          </span>
        )}
        <Image
          src={`/idle/${name.toLowerCase()}.png`}
          alt={name}
          width={72}
          height={72}
          className="sm:h-[88px] sm:w-[88px]"
        />
      </div>

      {/* Bar */}
      <div
        className="flex w-16 flex-col items-center justify-between rounded-t-2xl pt-3 pb-2 sm:w-24"
        style={{ height: `${barHeight}px`, backgroundColor: color }}
      >
        <span className="text-xs font-extrabold text-white/90 sm:text-base">
          Lv {level}
        </span>
      </div>

      {/* Name */}
      <span className="mt-2 text-xs font-bold text-zinc-600 sm:text-sm">
        {name}
      </span>
    </div>
  );
}

function MochiProgress({ step, total, color }) {
  const percent = Math.round(((step + 1) / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          {step + 1} / {total}
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
  const router = useRouter();
  const scores = computeEmochiScores(result);

  useEffect(() => {
    // Map internal role keys to emochi display names before sending
    const namedScores = Object.fromEntries(
      Object.entries(scores).map(([role, score]) => [CHARACTERS[role].name, score])
    );
    fetch("/api/quiz-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores: namedScores, personalityType: result.mbti }),
    }).catch(() => {});
  }, []);
  const leaderboard = Object.entries(scores)
    .map(([role, score]) => ({ role, score, ...CHARACTERS[role] }))
    .sort((a, b) => b.score - a.score);

  const MAX_BAR_H = 420;
  const MIN_BAR_H = 100;

  // Assign true ranks accounting for ties (same score = same rank)
  const uniqueScores = [...new Set(leaderboard.map((e) => e.score))].sort((a, b) => b - a);
  const totalSlots = leaderboard.length;

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 font-[family-name:var(--font-baloo)] sm:py-16"
      style={{
        background:
          "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
      }}
    >
      <div className="animate-pop-in w-full max-w-4xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-800 sm:text-4xl">
          Meet Your Emochi Squad
        </h2>

        {/* Podium chart */}
        <div className="mt-8 relative">

          <div className="flex items-end justify-center gap-3 sm:gap-5">
            {leaderboard.map(({ role, score, name, color, tint }, idx) => {
              const trueRank = uniqueScores.indexOf(score);
              const barH = MAX_BAR_H - (trueRank * ((MAX_BAR_H - MIN_BAR_H) / (totalSlots - 1)));
              return (
                <PodiumBar
                  key={role}
                  name={name}
                  color={color}
                  tint={tint}
                  score={score}
                  level={scoreToLevel(score)}
                  rank={trueRank}
                  barHeight={barH}
                />
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/interests")}
          className="mt-10 rounded-full px-9 py-4 text-base font-bold text-white shadow-[0_5px_0_0_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "#1a1a2e" }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
