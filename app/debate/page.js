"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CHARACTERS = [
  { id: "bubble", name: "Bubble", file: "bubble.png", left: 18, top: 30, size: 220, color: "#F97316", bubble: { left: 27, top: 18 } },
  { id: "wisey", name: "Wisey", file: "wisey-judge.png", left: 49.5, top: 32.5, size: 185, color: "#C9A857", bubble: { left: 49.5, top: 15 } },
  { id: "buzzy", name: "Buzzy", file: "buzzy.png", left: 78, top: 30, size: 220, color: "#FF6B4A", bubble: { left: 68, top: 18 } },
  { id: "cheer", name: "Cheer", file: "cheer.png", left: 72, top: 54, size: 210, color: "#FFC53D", bubble: { left: 79, top: 43 } },
  { id: "fear", name: "Fear", file: "fear.png", left: 28, top: 54, size: 200, color: "#A78BFA", bubble: { left: 18, top: 43 } },
  { id: "tear", name: "Tear", file: "tear.png", left: 12, top: 60, size: 220, color: "#4A90D9", bubble: { left: 19, top: 67 } },
  { id: "zen", name: "Zen", file: "zen.png", left: 90, top: 60, size: 220, color: "#5FD4C4", bubble: { left: 80, top: 67 } },
  { id: "dozy", name: "Dozy", file: "dozy.png", left: 67, top: 76, size: 220, color: "#6C7A96", bubble: { left: 58, top: 76 } },
];

const WISEY_COLOR = CHARACTERS.find((character) => character.id === "wisey").color;

// How long an emotion's bubble stays on screen before the next one takes
// over — scales with how much text it holds (longer lines linger longer),
// decoupled from how fast the backend actually streams turns in, so nothing
// flashes by before it can be read.
const MIN_DISPLAY_MS = 5200;
const MAX_DISPLAY_MS = 8500;
function displayDurationFor(text) {
  const raw = 3000 + (text?.length ?? 0) * 55;
  return Math.max(MIN_DISPLAY_MS, Math.min(MAX_DISPLAY_MS, raw));
}

// Offsets the speech-bubble tail toward its character, in px along the 1600x900 stage.
function bubbleTailOffset(character) {
  if (!character.bubble) return { x: 0, y: 40 };
  const dx = character.left - character.bubble.left;
  const dy = character.top - character.bubble.top;
  const len = Math.hypot(dx, dy) || 1;
  return { x: (dx / len) * 130, y: Math.max((dy / len) * 40, -14) };
}

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
  const [roundComplete, setRoundComplete] = useState(false);
  const [wiseyVerdict, setWiseyVerdict] = useState("");
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [verdictChat, setVerdictChat] = useState([]);
  const [verdictReply, setVerdictReply] = useState("");
  const [resultOpen, setResultOpen] = useState(false);
  const [resultData, setResultData] = useState(null); // { increase: [], decrease: [] }
  const [resultLoading, setResultLoading] = useState(false);
  const [bonkOpen, setBonkOpen] = useState(false);

  // Paces the emotion bubbles: turns are pushed here as they finish, and
  // revealed one at a time on a timer (see displayDurationFor) instead of
  // snapping to whatever the network just delivered.
  const queueRef = useRef([]);
  const advancingRef = useRef(false);
  const timersRef = useRef([]);
  const finishedRef = useRef(null); // callback to run once queue drains after the stream ends

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  function advanceQueue() {
    const next = queueRef.current.shift();
    if (!next) {
      advancingRef.current = false;
      setActiveSpeaker(null);
      if (finishedRef.current) {
        const done = finishedRef.current;
        finishedRef.current = null;
        done();
      }
      return;
    }
    advancingRef.current = true;
    setResponses((current) => ({ ...current, [next.id]: next.text }));
    setActiveSpeaker(next.id);
    const t = setTimeout(advanceQueue, displayDurationFor(next.text));
    timersRef.current.push(t);
  }

  function enqueueBubble(id, text) {
    if (!id || !text) return;
    queueRef.current.push({ id, text });
    if (!advancingRef.current) advanceQueue();
  }

  async function startDebate(event) {
    event.preventDefault();
    const nextTopic = topic.trim();
    if (!nextTopic || loading) return;

    setLoading(true);
    setError("");
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    queueRef.current = [];
    advancingRef.current = false;
    finishedRef.current = null;
    setActiveSpeaker(null);
    setResponses({});
    setRoundComplete(false);
    setWiseyVerdict("");

    try {
      const history = debateHistory.flatMap((entry) => [
        { speaker: "User", text: entry.prompt },
        ...entry.messages.map((item) => ({ speaker: item.agent, text: item.text })),
      ]);
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nextTopic, history, compact: true }),
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
      let isDirect = false;

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
            isDirect = Boolean(streamEvent.direct);
            summary = streamEvent.summary || nextTopic;
            setTopicSummary(summary);
          } else if (streamEvent.type === "turn_end") {
            // Renders the finished line for a turn — deltas are ignored here
            // since the bubble only appears once paced in by the queue below.
            const id = streamEvent.agent?.toLowerCase();
            messages.push({ agent: streamEvent.agent, text: streamEvent.text });
            if (id !== "wisey" || isDirect) {
              enqueueBubble(id, streamEvent.text);
            } else {
              setWiseyVerdict(streamEvent.text);
            }
          } else if (streamEvent.type === "error") {
            streamError = streamEvent.message || "The debate failed.";
          }
        }
      }

      if (streamError) throw new Error(streamError);

      const finalize = () => {
        setDebateHistory((currentHistory) => [
          ...currentHistory,
          {
            id: `${Date.now()}-${currentHistory.length}`,
            prompt: nextTopic,
            summary,
            messages,
          },
        ]);
        setRoundComplete(true);
      };
      // Let any bubbles still playing out finish their paced reveal before
      // flipping to "round complete" (which is what surfaces the verdict
      // button) — the network usually finishes well before the queue does.
      if (advancingRef.current || queueRef.current.length > 0) {
        finishedRef.current = finalize;
      } else {
        finalize();
      }
      setTopic("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function openVerdict() {
    setVerdictChat([{ from: "wisey", text: wiseyVerdict }]);
    setVerdictReply("");
    setVerdictOpen(true);
  }

  function closeVerdict() {
    setVerdictOpen(false);
  }

  function sendVerdictReply(event) {
    event.preventDefault();
    const text = verdictReply.trim();
    if (!text) return;
    setVerdictChat((chat) => [...chat, { from: "user", text }]);
    setVerdictReply("");
  }

  async function endDebate() {
    const userOpinion = verdictChat.filter(m => m.from === "user").map(m => m.text).join(" ");
    setVerdictOpen(false);
    setResultLoading(true);
    setBonkOpen(true);

    try {
      const res = await fetch("/api/debate/verdict-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: userOpinion || "no opinion given",
          topic: topicSummary,
          verdictText: wiseyVerdict,
        }),
      });
      const data = await res.json();
      setResultData(data.error ? null : data);
    } catch {
      setResultData(null);
    } finally {
      setResultLoading(false);
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

      <div className="home-btn">
        <Link href="/home" aria-label="Home" style={{ display: "flex", width: "100%", height: "100%" }}>
          <img src="/home.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </Link>
      </div>

      <div className="debate-stage" style={{ transform: `scale(${scale})` }}>
        {topicSummary && !roundComplete && (
          <section className="topic-panel" aria-live="polite">
            <span>Today&apos;s topic</span>
            <p>{topicSummary}</p>
          </section>
        )}

        {roundComplete && wiseyVerdict && (
          <button type="button" className="verdict-trigger" onClick={openVerdict}>
            <div className="hammer-badge">
              <img src="/hammer.png" alt="" className="hammer-icon" />
            </div>
            <span className="verdict-label">Verdict</span>
          </button>
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
            }}
            aria-live="polite"
          >
            <strong style={{ color: speaker.color }}>{speaker.name}</strong>
            <p>{responses[speaker.id]}</p>
            <span
              className="bubble-tail"
              style={{
                left: `calc(50% + ${bubbleTailOffset(speaker).x}px)`,
                top: `calc(50% + ${bubbleTailOffset(speaker).y}px)`,
              }}
            />
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
                        {character && (
                          <img
                            src={`/idle/${character.file}`}
                            alt=""
                            className="history-avatar"
                          />
                        )}
                        <div className="history-reply-body">
                          <strong style={{ color: character?.color || "#806b59" }}>
                            {character?.name || message.agent}
                          </strong>
                          <p>{message.text}</p>
                        </div>
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

      {verdictOpen && (
        <div className="verdict-overlay" onClick={closeVerdict}>
          <div className="verdict-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="verdict-close" onClick={closeVerdict} aria-label="Close">
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>

            <div className="verdict-gif-panel">
              <img src="/gif/wisey-verdict.gif" alt="Wisey" />
            </div>

            <div className="verdict-chat-panel">
              <div className="verdict-chat-messages">
                {verdictChat.map((message, index) => (
                  <div className={`verdict-msg ${message.from}`} key={index}>
                    {message.from === "wisey" && <strong>Wisey</strong>}
                    <p>{message.text}</p>
                  </div>
                ))}
              </div>
              <form className="verdict-reply-form" onSubmit={sendVerdictReply}>
                <input
                  value={verdictReply}
                  onChange={(event) => setVerdictReply(event.target.value)}
                  placeholder="Share your thoughts…"
                  aria-label="Reply to Wisey"
                />
                <button type="submit" aria-label="Send" disabled={!verdictReply.trim()}>
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                </button>
                <button type="button" className="end-debate-btn" onClick={endDebate}>
                  End Debate
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {bonkOpen && (
        <div className="result-overlay">
          {/* ── Bonk animation phase ── */}
          {(resultLoading || !resultData) ? (
            <div className="bonk-loading">
              <img src="/idle/wisey.png" alt="Wisey" className="bonk-wisey-spin" />
              <p>Wisey is deciding…</p>
            </div>
          ) : !resultOpen ? (
            (() => {
              const winners = resultData.increase.map(n => CHARACTERS.find(c => c.name === n)).filter(Boolean);
              const losers  = resultData.decrease.map(n => CHARACTERS.find(c => c.name === n)).filter(Boolean);
              return (
                <div className="bonk-stage" ref={el => { if (el && !resultOpen) setTimeout(() => setResultOpen(true), 3800); }}>
                  {winners.map((w, i) => (
                    <div key={w.id} className="bonk-pair" style={{ animationDelay: `${i * 0.25}s` }}>
                      <div className="bonk-char bonk-attacker" style={{ animationDelay: `${i * 0.25}s` }}>
                        <img src={`/gif/${w.id}-bonk.gif`} alt={w.name} />
                        <span className="bonk-char-name" style={{ color: w.color }}>{w.name}</span>
                      </div>
                      <div className="bonk-impact">💥</div>
                      {losers[i] && (
                        <div className="bonk-char bonk-victim" style={{ animationDelay: `${i * 0.25 + 0.5}s` }}>
                          <img src={`/idle/${losers[i].file}`} alt={losers[i].name} />
                          <span className="bonk-char-name" style={{ color: losers[i].color }}>{losers[i].name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            /* ── Result screen ── */
            <div className="rm" onClick={e => e.stopPropagation()}>
              <div className="rm-title">Debate Results</div>
              <div className="rm-sub">Here&apos;s how your decision shaped your emotions</div>

              <div className="rm-cols">
                {/* Increase column */}
                <div className="rm-col rm-col-inc">
                  <div className="rm-col-label">▲ +3</div>
                  {resultData.increase.map(name => {
                    const char = CHARACTERS.find(c => c.name === name);
                    if (!char) return null;
                    return (
                      <div key={name} className="rm-card rm-card-inc">
                        <div className="rm-avatar" style={{ borderColor: char.color, background: char.color + "22" }}>
                          <img src={`/idle/${char.file}`} alt={char.name} />
                        </div>
                        <span className="rm-name" style={{ color: char.color }}>{char.name}</span>
                        <span className="rm-delta rm-delta-inc">+3</span>
                      </div>
                    );
                  })}
                </div>

                <div className="rm-divider" />

                {/* Decrease column */}
                <div className="rm-col rm-col-dec">
                  <div className="rm-col-label rm-col-label-dec">▼ −3</div>
                  {resultData.decrease.map(name => {
                    const char = CHARACTERS.find(c => c.name === name);
                    if (!char) return null;
                    return (
                      <div key={name} className="rm-card rm-card-dec">
                        <div className="rm-avatar" style={{ borderColor: char.color, background: char.color + "22" }}>
                          <img src={`/idle/${char.file}`} alt={char.name} />
                        </div>
                        <span className="rm-name" style={{ color: char.color }}>{char.name}</span>
                        <span className="rm-delta rm-delta-dec">−3</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link href="/home" className="rm-btn">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      )}

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
        .home-btn {
          position: fixed;
          z-index: 40;
          top: 20px;
          left: 20px;
          width: 56px;
          height: 56px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 9999px;
          background: rgba(255, 250, 233, .58);
          box-shadow: 0 8px 25px rgba(74, 45, 13, .18);
          backdrop-filter: blur(10px);
          transition: transform .18s ease, background .18s ease;
        }
        .home-btn:hover { transform: scale(1.1); background: rgba(255, 250, 233, .78); }
        .verdict-trigger {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 48%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
        }
        .hammer-badge {
          width: 92px;
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: transparent;
          box-shadow: 0 10px 26px rgba(74, 45, 13, .3);
          animation: hammer-float 2.2s ease-in-out infinite;
        }
        .hammer-icon {
          width: 66%;
          height: 66%;
          object-fit: contain;
        }
        .verdict-label {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #4d351e;
          text-shadow: 0 2px 6px rgba(255, 255, 255, .5);
        }
        .verdict-overlay {
          position: fixed;
          z-index: 50;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(30, 20, 8, .45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .verdict-modal {
          position: relative;
          width: min(90vw, 780px);
          height: min(80vh, 460px);
          display: flex;
          border-radius: 32px;
          overflow: hidden;
          background: rgba(255, 250, 240, .92);
          box-shadow: 0 30px 70px rgba(0, 0, 0, .35);
        }
        .verdict-close {
          position: absolute;
          z-index: 5;
          top: 14px;
          right: 14px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 9999px;
          background: rgba(0, 0, 0, .12);
          color: #4d351e;
          cursor: pointer;
        }
        .verdict-close:hover { background: rgba(0, 0, 0, .22); }
        .verdict-gif-panel {
          flex: 0 0 42%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #f6e7c4, #e8cf9a);
        }
        .verdict-gif-panel img { width: 82%; height: 82%; object-fit: contain; }
        .verdict-chat-panel {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          padding: 24px;
        }
        .verdict-chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }
        .verdict-msg {
          max-width: 85%;
          padding: 10px 15px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
        }
        .verdict-msg strong { display: block; margin-bottom: 2px; font-size: 11px; font-weight: 800; color: ${WISEY_COLOR}; }
        .verdict-msg p { margin: 0; }
        .verdict-msg.wisey {
          align-self: flex-start;
          border-radius: 5px 18px 18px 18px;
          background: rgba(201, 168, 87, .22);
          color: #4d351e;
        }
        .verdict-msg.user {
          align-self: flex-end;
          border-radius: 18px 18px 5px 18px;
          background: #4d351e;
          color: #fff9e9;
        }
        .verdict-reply-form {
          flex: 0 0 auto;
          margin-top: 14px;
          display: flex;
          gap: 8px;
        }
        .verdict-reply-form input {
          flex: 1;
          min-width: 0;
          height: 42px;
          padding: 0 15px;
          outline: none;
          border: 1px solid rgba(77, 53, 30, .18);
          border-radius: 16px;
          background: #fff;
          font: inherit;
          font-size: 14px;
        }
        .verdict-reply-form button[type="submit"] {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          padding: 0;
          border: 0;
          border-radius: 9999px;
          background: #4d351e;
          color: #fff9e9;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .verdict-reply-form button[type="submit"]:disabled { opacity: .5; cursor: default; }
        @keyframes hammer-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
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
          color: #3d2d20;
          border: 2px solid var(--character-color);
          border-radius: 24px;
          background: rgba(255, 250, 240, .93);
          box-shadow: 0 13px 32px rgba(41, 27, 14, .22);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: bubble-arrive .36s cubic-bezier(.2, .9, .3, 1.2) both;
        }
        .speech-bubble strong {
          display: block;
          margin-bottom: 3px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: .3px;
        }
        .speech-bubble p { font-size: 19px; font-weight: 600; line-height: 1.35; }
        .bubble-tail {
          position: absolute;
          z-index: -1;
          width: 20px;
          height: 20px;
          transform: translate(-50%, -50%) rotate(45deg);
          background: rgba(255, 250, 240, .93);
          border: 2px solid var(--character-color);
        }
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
        .history-prompt p, .history-reply p { margin: 0; font-size: 23px; line-height: 1.38; }
        .history-summary {
          margin: 9px 3px 7px;
          color: rgba(91, 58, 33, .62);
          font-size: 11px;
          font-weight: 800;
          text-align: center;
        }
        .history-reply {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 6px 24px 0 0;
          padding: 9px 12px;
          border: 1px solid rgba(255, 255, 255, .4);
          border-radius: 5px 16px 16px 16px;
          background: rgba(255, 255, 255, .36);
          color: #4a3827;
        }
        .history-avatar {
          flex: 0 0 auto;
          width: 32px;
          height: 32px;
          object-fit: contain;
          margin-top: 1px;
        }
        .history-reply-body { flex: 1; min-width: 0; }
        .history-reply strong { display: block; margin-bottom: 1px; font-size: 11px; font-weight: 800; }
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
          .character.is-speaking, .speech-bubble, .hammer-badge { animation: none; }
        }

        /* ── End Debate button ── */
        .end-debate-btn {
          flex-shrink: 0;
          padding: 0 16px;
          height: 44px;
          border: none;
          border-radius: 30px;
          background: #4d351e;
          color: #fff9e9;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: opacity .15s;
          white-space: nowrap;
        }
        .end-debate-btn:hover { opacity: .82; }

        /* ── Bonk animation ── */
        @keyframes attacker-swing {
          0%   { transform: translateX(-60px) rotate(-15deg); opacity: 0; }
          40%  { transform: translateX(20px) rotate(10deg); opacity: 1; }
          55%  { transform: translateX(0px) rotate(0deg); }
          70%  { transform: translateX(10px) rotate(5deg); }
          100% { transform: translateX(0px) rotate(0deg); }
        }
        @keyframes victim-shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(8px) rotate(6deg); }
          40%  { transform: translateX(-6px) rotate(-4deg); }
          60%  { transform: translateX(5px) rotate(3deg); }
          80%  { transform: translateX(-3px) rotate(-2deg); }
          100% { transform: translateX(0) rotate(0); }
        }
        @keyframes stars-pop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          50%  { transform: scale(1.4) rotate(10deg); opacity: 1; }
          80%  { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(.8) rotate(0deg); opacity: 0; }
        }
        .bonk-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #fff9e9;
          font-size: 17px;
          font-weight: 700;
        }
        .bonk-wisey-spin {
          width: 80px;
          height: 80px;
          object-fit: contain;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .bonk-stage {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 72px;
        }
        .bonk-pair {
          display: flex;
          align-items: flex-end;
          gap: 0px;
        }
        .bonk-char {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .bonk-char img {
          width: 90px;
          height: 90px;
          object-fit: contain;
          filter: drop-shadow(0 8px 20px rgba(0,0,0,.5));
        }
        .bonk-attacker img {
          width: 140px;
          height: 140px;
        }
        .bonk-char-name {
          font-size: 13px;
          font-weight: 800;
          text-shadow: 0 1px 4px rgba(0,0,0,.6);
        }
        .bonk-attacker img {
          animation: attacker-swing .6s cubic-bezier(.2,.8,.3,1.1) .3s both;
        }
        .bonk-victim img {
          animation: victim-shake .5s ease .3s both;
        }
        .bonk-impact {
          font-size: 40px;
          animation: stars-pop .5s ease .3s both;
          line-height: 1;
          margin-bottom: 44px;
          flex-shrink: 0;
        }

        /* ── Result overlay ── */
        .result-overlay {
          position: fixed;
          z-index: 60;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(20, 12, 4, .65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .rm {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 61;
          width: min(88vw, 400px);
          padding: 24px 20px 20px;
          border-radius: 28px;
          background: #fffaec;
          box-shadow: 0 24px 60px rgba(0,0,0,.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          animation: bubble-arrive .35s cubic-bezier(.2,.9,.3,1.1) both;
        }
        .rm-title {
          font-size: 20px;
          font-weight: 900;
          color: #3b2510;
          letter-spacing: .2px;
        }
        .rm-sub {
          font-size: 12px;
          color: rgba(59,37,16,.55);
          font-weight: 600;
          text-align: center;
          line-height: 1.4;
          margin-bottom: 4px;
        }
        .rm-cols {
          width: 100%;
          display: flex;
          align-items: stretch;
          gap: 0;
        }
        .rm-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 12px 10px;
          border-radius: 18px;
        }
        .rm-col-inc { background: rgba(22,163,74,.07); }
        .rm-col-dec { background: rgba(220,38,38,.07); }
        .rm-col-label {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #16a34a;
        }
        .rm-col-label-dec { color: #dc2626; }
        .rm-divider {
          width: 1px;
          background: rgba(59,37,16,.1);
          margin: 0 10px;
          flex-shrink: 0;
        }
        .rm-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        .rm-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .rm-avatar img {
          width: 80%;
          height: 80%;
          object-fit: contain;
        }
        .rm-name {
          font-size: 13px;
          font-weight: 800;
        }
        .rm-delta {
          font-size: 17px;
          font-weight: 900;
        }
        .rm-delta-inc { color: #16a34a; }
        .rm-delta-dec { color: #dc2626; }
        .rm-btn {
          width: 100%;
          margin-top: 6px;
          padding: 13px 0;
          border: none;
          border-radius: 30px;
          background: #3b2510;
          color: #fff9e9;
          font: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: opacity .15s;
          text-align: center;
          text-decoration: none;
          display: block;
        }
        .rm-btn:hover { opacity: .82; }
      `}</style>
    </main>
  );
}
