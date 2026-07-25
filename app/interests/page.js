"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { INTEREST_CATEGORIES, MAX_INTERESTS } from "@/lib/interests";

const LOCAL_MAP = Object.fromEntries(
  INTEREST_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => [
      item.label.toLowerCase(),
      { icon: item.icon, color: cat.color, tint: cat.tint },
    ])
  )
);

function enrichInterest(name) {
  const match = LOCAL_MAP[name.toLowerCase()];
  return {
    label: name,
    icon: match?.icon ?? "interests",
    color: match?.color ?? "#6C7A96",
    tint: match?.tint ?? "#E4E8F2",
  };
}

export default function InterestsPage() {
  const router = useRouter();
  const [allInterests, setAllInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/interests")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllInterests(data.map((row) => enrichInterest(row.name)));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggle(item) {
    setSelected((prev) => {
      if (prev.includes(item)) return prev.filter((i) => i !== item);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, item];
    });
  }

  async function handleContinue() {
    try {
      localStorage.setItem("emochi_interests", JSON.stringify(selected));
    } catch {}
    await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: selected }),
    }).catch(() => {});
    router.push("/home");
  }

  const isFull = selected.length >= MAX_INTERESTS;
  const filtered = allInterests.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center px-4 py-12 font-[family-name:var(--font-baloo)] sm:py-16 overflow-hidden"
      style={{
        background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
      }}
    >
      {/* Decorative avatars - all 8 Emochi */}
      {/* Top row */}
      <div className="absolute top-8 left-4 sm:left-8 opacity-60 pointer-events-none" style={{ width: "70px", height: "70px", animation: "float-bob 3.8s ease-in-out infinite 0s" }}>
        <Image src="/idle/wisey.png" alt="Wisey" fill style={{ objectFit: "contain" }} priority />
      </div>
      <div className="absolute top-12 left-1/4 opacity-50 pointer-events-none hidden sm:block" style={{ width: "65px", height: "65px", animation: "float-bob 4s ease-in-out infinite 0.5s" }}>
        <Image src="/idle/cheer.png" alt="Cheer" fill style={{ objectFit: "contain" }} priority />
      </div>
      <div className="absolute top-16 right-1/4 opacity-55 pointer-events-none hidden sm:block" style={{ width: "68px", height: "68px", animation: "float-bob 3.9s ease-in-out infinite 1s" }}>
        <Image src="/idle/fear.png" alt="Fear" fill style={{ objectFit: "contain" }} priority />
      </div>
      <div className="absolute top-8 right-4 sm:right-8 opacity-50 pointer-events-none" style={{ width: "72px", height: "72px", animation: "float-bob 4.1s ease-in-out infinite 1.5s" }}>
        <Image src="/idle/buzzy.png" alt="Buzzy" fill style={{ objectFit: "contain" }} priority />
      </div>

      {/* Middle sides - visible only on larger screens */}
      <div className="absolute left-2 top-1/2 opacity-45 pointer-events-none hidden lg:block" style={{ width: "60px", height: "60px", animation: "float-bob 4.2s ease-in-out infinite 0.8s" }}>
        <Image src="/idle/tear.png" alt="Tear" fill style={{ objectFit: "contain" }} priority />
      </div>
      <div className="absolute right-2 top-1/2 opacity-45 pointer-events-none hidden lg:block" style={{ width: "60px", height: "60px", animation: "float-bob 4s ease-in-out infinite 1.2s" }}>
        <Image src="/idle/dozy.png" alt="Dozy" fill style={{ objectFit: "contain" }} priority />
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-8 left-6 sm:left-12 opacity-55 pointer-events-none" style={{ width: "70px", height: "70px", animation: "float-bob 3.8s ease-in-out infinite 1s" }}>
        <Image src="/idle/zen.png" alt="Zen" fill style={{ objectFit: "contain" }} priority />
      </div>
      <div className="absolute bottom-12 right-8 sm:right-12 opacity-50 pointer-events-none" style={{ width: "68px", height: "68px", animation: "float-bob 4.2s ease-in-out infinite 1.5s" }}>
        <Image src="/idle/bubble.png" alt="Bubble" fill style={{ objectFit: "contain" }} priority />
      </div>

      <div className="relative w-full max-w-6xl text-center z-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-800 sm:text-4xl">
          What do you enjoy? (Pick up to {MAX_INTERESTS})
        </h1>
        <div className="sticky top-4 z-20 mt-5 flex justify-center">
          <span className={`rounded-full px-5 py-2 text-sm font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.06)] transition-all ${
            isFull
              ? "bg-gradient-to-r from-yellow-200 to-yellow-100 text-yellow-800 scale-105"
              : "bg-white text-zinc-600"
          }`}>
            {selected.length} / {MAX_INTERESTS} selected {isFull && "🎉"}
          </span>
        </div>

        <input
          type="text"
          placeholder="Search interests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-6 w-full rounded-full border-[2px] border-zinc-200 bg-white px-6 py-3 text-base font-semibold text-zinc-800 placeholder-zinc-400 shadow-sm transition-all focus:border-zinc-400 focus:outline-none"
        />

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {loading && (
            <p className="text-zinc-400 text-sm font-semibold">Loading interests...</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-zinc-400 text-sm font-semibold">No interests found.</p>
          )}
          {filtered.map(({ label, icon, color, tint }) => {
            const isSelected = selected.includes(label);
            const isDisabled = !isSelected && isFull;
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggle(label)}
                disabled={isDisabled}
                className={`flex items-center gap-2 rounded-full border-[2.5px] px-5 py-3 text-base font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? "border-current shadow-sm"
                    : isDisabled
                      ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300"
                      : "border-zinc-200 bg-transparent text-zinc-600 hover:border-zinc-300 hover:bg-white/60"
                }`}
                style={isSelected ? { color, backgroundColor: tint } : undefined}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {icon}
                </span>
                {label}
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="sticky bottom-6 mt-10 rounded-full px-9 py-4 text-base font-bold text-white shadow-[0_5px_0_0_rgba(0,0,0,0.15)] transition-all enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ backgroundColor: "#1a1a2e" }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
