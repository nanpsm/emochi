"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTEREST_CATEGORIES, MAX_INTERESTS } from "@/lib/interests";

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);

  function toggle(item) {
    setSelected((prev) => {
      if (prev.includes(item)) return prev.filter((i) => i !== item);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, item];
    });
  }

  function handleContinue() {
    try {
      localStorage.setItem("emochi_interests", JSON.stringify(selected));
    } catch {}
    router.push("/home");
  }

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center px-4 py-12 font-[family-name:var(--font-baloo)] sm:py-16"
      style={{
        background:
          "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
      }}
    >
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-800 sm:text-4xl">
          What do you enjoy?
        </h1>
        <p className="mt-3 text-base text-zinc-500 sm:text-lg">
          Pick up to {MAX_INTERESTS} — your Emochi will use these to personalize advice and
          conversations.
        </p>
        <p className="mt-1 text-sm font-bold text-[#C9A857]">
          {selected.length} / {MAX_INTERESTS} selected
        </p>

        <div className="mt-8 flex flex-col gap-7 text-left">
          {INTEREST_CATEGORIES.map((category) => (
            <div key={category.name}>
              <p className="mb-2.5 text-sm font-bold uppercase tracking-wide text-zinc-400">
                {category.name}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {category.items.map((item) => {
                  const isSelected = selected.includes(item);
                  const isDisabled = !isSelected && selected.length >= MAX_INTERESTS;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(item)}
                      disabled={isDisabled}
                      className={`rounded-full border-[2.5px] px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                        isSelected
                          ? "border-[#1a1a2e] bg-[#1a1a2e] text-white shadow-md"
                          : isDisabled
                            ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {isSelected ? "✓ " : ""}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="mt-10 rounded-full px-9 py-4 text-base font-bold text-white shadow-[0_5px_0_0_rgba(0,0,0,0.15)] transition-all enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ backgroundColor: "#1a1a2e" }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
