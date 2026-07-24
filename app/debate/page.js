"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

export default function DebatePage() {
  const [scale, setScale] = useState(1);
  const [topic, setTopic] = useState("");
  const [topicSummary, setTopicSummary] = useState("");
  const [responses, setResponses] = useState(null);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [debateHistory, setDebateHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  async function startDebate(event) {
    event.preventDefault();
    const nextTopic = topic.trim();
    if (!nextTopic || loading) return;

    setLoading(true);
    setError("");
    setActiveSpeaker(null);
    setResponses({});

    try {
      const history = debateHistory.flatMap((entry) => [
        { speaker: "User", text: entry.prompt },
        ...entry.messages.map((item) => ({ speaker: item.agent, text: item.text })),
      ]);
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nextTopic, history }),
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "The debate could not begin.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const messages = [];
      let buffer = "";
      let summary = nextTopic;
      let streamError = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline;
        while ((newline = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) continue;

          let streamEvent;
          try {
            streamEvent = JSON.parse(line);
          } catch {
            continue;
          }

          if (streamEvent.type === "cast") {
            summary = streamEvent.summary || nextTopic;
            setTopicSummary(summary);
          } else if (streamEvent.type === "turn_start") {
            const id = streamEvent.agent?.toLowerCase();
            if (id && id !== "wisey") {
              setResponses((current) => ({ ...current, [id]: "" }));
            }
            setActiveSpeaker(id === "wisey" ? null : id);
          } else if (streamEvent.type === "turn") {
            const id = streamEvent.agent?.toLowerCase();
            messages.push({ agent: streamEvent.agent, text: streamEvent.text });
            if (id !== "wisey") {
              setResponses((current) => ({ ...current, [id]: streamEvent.text }));
              setActiveSpeaker(id);
            } else {
              setActiveSpeaker(null);
            }
          } else if (streamEvent.type === "error") {
            streamError = streamEvent.message || "The debate failed.";
          }
        }
      }

      if (streamError) throw new Error(streamError);
      setDebateHistory((currentHistory) => [
        ...currentHistory,
        {
          id: `${Date.now()}-${currentHistory.length}`,
          prompt: nextTopic,
          summary,
          messages,
        },
      ]);
      setTopic("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setActiveSpeaker(null);
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

        <button
          type="button"
          className={`history-toggle ${historyOpen ? "is-open" : ""}`}
          onClick={() => setHistoryOpen((open) => !open)}
          aria-label={historyOpen ? "Close chat history" : "Open chat history"}
          aria-expanded={historyOpen}
          aria-controls="debate-history"
          title={historyOpen ? "Close chat history" : "Chat history"}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {historyOpen ? "more_down" : "history"}
          </span>
        </button>

        <aside
          id="debate-history"
          className={`history-panel ${historyOpen ? "is-open" : ""}`}
          aria-hidden={!historyOpen}
        >
          <header>
            <div>
              <span className="material-symbols-outlined" aria-hidden="true">forum</span>
              <h2>Chat history</h2>
            </div>
            {debateHistory.length > 0 && (
              <span>{debateHistory.length} {debateHistory.length === 1 ? "topic" : "topics"}</span>
            )}
          </header>

          <div className="history-list">
            {debateHistory.length === 0 ? (
              <div className="history-empty">
                <span className="material-symbols-outlined" aria-hidden="true">chat_bubble</span>
                <p>Your debates will appear here.</p>
              </div>
            ) : (
              [...debateHistory].reverse().map((entry) => (
                <section className="history-entry" key={entry.id}>
                  <div className="history-prompt">
                    <span>You</span>
                    <p>{entry.prompt}</p>
                  </div>
                  <div className="history-summary">{entry.summary}</div>
                  {entry.messages.map((message, index) => {
                    const character = CHARACTERS.find(
                      (item) => item.id === message.agent?.toLowerCase(),
                    );
                    if (!message.text) return null;
                    return (
                      <div className="history-reply" key={`${message.agent}-${index}`}>
                        <strong style={{ color: character?.color || "#806b59" }}>
                          {character?.name || message.agent}
                        </strong>
                        <p>{message.text}</p>
                      </div>
                    );
                  })}
                </section>
              ))
            )}
          </div>
        </aside>

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
        .history-toggle {
          position: absolute;
          z-index: 31;
          left: calc(50% + 340px);
          bottom: 24px;
          width: 63px;
          height: 63px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 9999px;
          background: rgba(255, 250, 233, .58);
          box-shadow: 0 8px 25px rgba(74, 45, 13, .18);
          backdrop-filter: blur(10px);
          color: #5b3a21;
          cursor: pointer;
          transition: left .22s ease, bottom .22s ease, transform .18s ease, background .18s ease;
        }
        .history-toggle:hover { transform: scale(1.1); background: rgba(255, 250, 233, .78); }
        .history-toggle.is-open {
          left: calc(100% - 460px);
          bottom: 24px;
        }
        .history-toggle .material-symbols-outlined { font-size: 28px; }
        .history-panel {
          position: absolute;
          z-index: 30;
          top: 18px;
          right: 18px;
          width: 450px;
          bottom: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 28px;
          background: rgba(255, 250, 233, .80);
          box-shadow: 0 12px 34px rgba(74, 45, 13, .2);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          opacity: 0;
          pointer-events: none;
          transform: translateX(35px) scale(.96);
          transform-origin: top right;
          transition: opacity .22s ease, transform .22s ease;
        }
        .history-panel.is-open {
          opacity: 1;
          pointer-events: auto;
          transform: none;
        }
        .history-panel header {
          min-height: 48px;
          padding-right: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(91, 58, 33, .12);
          color: #5b3a21;
        }
        .history-panel header > div { display: flex; align-items: center; gap: 8px; }
        .history-panel h2 { margin: 0; font-size: 18px; line-height: 1; }
        .history-panel header > span { font-size: 11px; font-weight: 700; opacity: .65; }
        .history-list {
          flex: 1;
          min-height: 0;
          margin-top: 13px;
          padding: 0 5px 76px 0;
          overflow-y: auto;
          scrollbar-color: rgba(91, 58, 33, .3) transparent;
          scrollbar-width: thin;
        }
        .history-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: rgba(91, 58, 33, .6);
          text-align: center;
        }
        .history-empty .material-symbols-outlined { font-size: 34px; }
        .history-empty p { margin: 6px 0; font-size: 14px; font-weight: 650; }
        .history-entry {
          padding: 0 0 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(91, 58, 33, .12);
        }
        .history-entry:last-child { margin-bottom: 0; border-bottom: 0; }
        .history-prompt {
          margin-left: 35px;
          padding: 10px 13px;
          border-radius: 18px 18px 5px 18px;
          background: rgba(91, 58, 33, .82);
          color: #fff9e9;
        }
        .history-prompt span {
          display: block;
          margin-bottom: 2px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          opacity: .7;
        }
        .history-prompt p, .history-reply p { margin: 0; font-size: 13px; line-height: 1.38; }
        .history-summary {
          margin: 9px 3px 7px;
          color: rgba(91, 58, 33, .62);
          font-size: 11px;
          font-weight: 800;
          text-align: center;
        }
        .history-reply {
          margin: 6px 24px 0 0;
          padding: 9px 12px;
          border: 1px solid rgba(255, 255, 255, .4);
          border-radius: 5px 16px 16px 16px;
          background: rgba(255, 255, 255, .36);
          color: #4a3827;
        }
        .history-reply strong { display: block; margin-bottom: 1px; font-size: 11px; }
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
        .topic-form button:hover:not(:disabled) { transform: scale(1.2); }
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
