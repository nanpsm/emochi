"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const CHARACTERS = [
  { id: "bubble", name: "Bubble", file: "bubble.png", left: 18, top: 30, size: 220, color: "#F97316", bubble: { left: 27, top: 18 } },
  { id: "wisey", name: "Wisey", file: "wisey-judge.png", left: 49.5, top: 32.5, size: 185, color: "#C9A857" },
  { id: "buzzy", name: "Buzzy", file: "buzzy.png", left: 78, top: 30, size: 220, color: "#FF6B4A", bubble: { left: 68, top: 18 } },
  { id: "cheer", name: "Cheer", file: "cheer.png", left: 72, top: 54, size: 210, color: "#FFC53D", bubble: { left: 79, top: 43 } },
  { id: "fear", name: "Fear", file: "fear.png", left: 28, top: 54, size: 200, color: "#A78BFA", bubble: { left: 18, top: 43 } },
  { id: "tear", name: "Tear", file: "tear.png", left: 12, top: 60, size: 220, color: "#4A90D9", bubble: { left: 19, top: 67 } },
  { id: "zen", name: "Zen", file: "zen.png", left: 90, top: 60, size: 220, color: "#5FD4C4", bubble: { left: 80, top: 67 } },
  { id: "dozy", name: "Dozy", file: "dozy.png", left: 67, top: 76, size: 220, color: "#6C7A96", bubble: { left: 58, top: 76 } },
];

const SPEAKING_ORDER = ["bubble", "buzzy", "fear", "cheer", "tear", "zen", "dozy"];
const SPEAKING_TIME = 4800;

export default function DebatePage() {
  const [scale, setScale] = useState(1);
  const [topic, setTopic] = useState("");
  const [topicSummary, setTopicSummary] = useState("");
  const [responses, setResponses] = useState(null);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timers = useRef([]);

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function playDebate(nextResponses) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResponses(nextResponses);
    setActiveSpeaker(SPEAKING_ORDER[0]);

    SPEAKING_ORDER.forEach((id, index) => {
      if (index > 0) {
        timers.current.push(setTimeout(() => setActiveSpeaker(id), index * SPEAKING_TIME));
      }
    });
    timers.current.push(
      setTimeout(() => setActiveSpeaker(null), SPEAKING_ORDER.length * SPEAKING_TIME),
    );
  }

  async function startDebate(event) {
    event.preventDefault();
    const nextTopic = topic.trim();
    if (!nextTopic || loading) return;

    setLoading(true);
    setError("");
    setActiveSpeaker(null);
    timers.current.forEach(clearTimeout);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: nextTopic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The debate could not begin.");

      setTopicSummary(data.summary || nextTopic);
      playDebate(data.responses);
      setTopic("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const speaker = CHARACTERS.find((character) => character.id === activeSpeaker);

  return (
    <main className="debate-viewport">
      <Image
        src="/debate.png"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "fill" }}
      />
      <div className="debate-stage" style={{ transform: `scale(${scale})` }}>
        {topicSummary && (
          <section className="topic-panel" aria-live="polite">
            <span>Today&apos;s topic</span>
            <p>{topicSummary}</p>
          </section>
        )}

        {CHARACTERS.map((character) => (
          <div
            key={character.id}
            className={`character ${activeSpeaker === character.id ? "is-speaking" : ""}`}
            style={{
              left: `${character.left}%`,
              top: `${character.top}%`,
              width: character.size,
              height: character.size,
              "--character-color": character.color,
            }}
          >
            <Image
              src={`/idle/${character.file}`}
              alt={character.name}
              width={character.size}
              height={character.size}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        ))}

        {speaker && responses?.[speaker.id] && (
          <aside
            key={speaker.id}
            className="speech-bubble"
            style={{
              left: `${speaker.bubble.left}%`,
              top: `${speaker.bubble.top}%`,
              "--character-color": speaker.color,
              "--bubble-fill": `${speaker.color}B8`,
            }}
            aria-live="polite"
          >
            <strong>{speaker.name}</strong>
            <p>{responses[speaker.id]}</p>
          </aside>
        )}

        <form className="topic-form" onSubmit={startDebate}>
          <div>
            <input
              id="debate-topic"
              aria-label="Debate topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Tell us what’s on your mind…"
              maxLength={500}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              aria-label={loading ? "Starting debate" : "Ask the room"}
              title={loading ? "Starting debate" : "Ask the room"}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {loading ? "progress_activity" : "arrow_upward"}
              </span>
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>

      <style jsx>{`
        .debate-viewport {
          position: fixed;
          inset: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #d8c18f;
          font-family: var(--font-baloo), "Baloo 2", "Segoe UI", sans-serif;
        }
        .debate-stage {
          position: relative;
          z-index: 1;
          width: 1600px;
          height: 900px;
          flex: none;
          transform-origin: center;
          overflow: hidden;
        }
        .character {
          position: absolute;
          z-index: 3;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 10px 14px rgba(0, 0, 0, .35));
          transition: filter .25s ease;
        }
        .character.is-speaking {
          z-index: 5;
          animation: character-talk .72s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 22px color-mix(in srgb, var(--character-color) 75%, white));
        }
        .topic-panel {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 48%;
          width: 370px;
          min-height: 108px;
          padding: 18px 25px;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255, 255, 255, .48);
          border-radius: 25px;
          background: rgba(255, 250, 230, .28);
          box-shadow: 0 12px 34px rgba(87, 57, 18, .15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          text-align: center;
          color: #4d351e;
        }
        .topic-panel span {
          display: block;
          margin-bottom: 4px;
          color: rgba(77, 53, 30, .7);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .topic-panel p, .speech-bubble p { margin: 0; }
        .topic-panel p { font-size: 19px; font-weight: 750; line-height: 1.28; }
        .speech-bubble {
          position: absolute;
          z-index: 12;
          width: 310px;
          padding: 18px 21px;
          transform: translate(-50%, -50%);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, .5);
          border-radius: 24px;
          background: var(--bubble-fill);
          box-shadow: 0 13px 32px rgba(41, 27, 14, .22);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: bubble-arrive .36s cubic-bezier(.2, .9, .3, 1.2) both;
          text-shadow: 0 1px 2px rgba(0, 0, 0, .18);
        }
        .speech-bubble strong {
          display: block;
          margin-bottom: 3px;
          font-size: 15px;
          letter-spacing: .3px;
        }
        .speech-bubble p { font-size: 16px; font-weight: 600; line-height: 1.35; }
        .topic-form {
          position: absolute;
          z-index: 20;
          left: 50%;
          bottom: 24px;
          width: 650px;
          padding: 10px;
          transform: translateX(-50%);
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 28px;
          background: rgba(255, 250, 233, .48);
          box-shadow: 0 12px 34px rgba(74, 45, 13, .2);
          backdrop-filter: blur(10px);
        }
        .topic-form > div { display: flex; gap: 9px; }
        .topic-form input {
          flex: 1;
          min-width: 0;
          height: 45px;
          padding: 0 17px;
          outline: none;
          border: 0;
          border-radius: 18px;
          background: transparent;
          color: #3d2d20;
          font: inherit;
          font-size: 15px;
        }
        .topic-form:focus-within {
          border-color: rgba(255, 255, 255, .85);
          box-shadow: 0 12px 34px rgba(74, 45, 13, .2), 0 0 0 3px rgba(201, 168, 87, .18);
        }
        .topic-form button {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          padding: 0;
          border: 0;
          border-radius: 9999px;
          background: #5b3a21;
          color: #fff9e9;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform .18s ease, opacity .18s ease;
        }
        .topic-form button:hover:not(:disabled) { transform: scale(1.5); }
        .topic-form button .material-symbols-outlined { font-size: 23px; font-weight: 700; }
        .topic-form button:disabled { cursor: default; opacity: .58; }
        .form-error { margin: 7px 3px 0; color: #9e2f25; font-size: 12px; font-weight: 700; }
        @keyframes bubble-arrive {
          from { opacity: 0; transform: translate(-50%, -38%) scale(.78); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes character-talk {
          from { transform: translate(-50%, -50%) rotate(-1.5deg) scale(1); }
          to { transform: translate(-50%, -53%) rotate(1.5deg) scale(1.035); }
        }
        @media (prefers-reduced-motion: reduce) {
          .character.is-speaking, .speech-bubble { animation: none; }
        }
      `}</style>
    </main>
  );
}
