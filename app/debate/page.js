"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const INK = "#1a1a2e";

// Table center and ellipse radii (within 1600×900 canvas)
const CX = 800, CY = 460;
const RX = 340, RY = 210;

const SEATS = [
  { id: "cheer",  name: "Cheer",  color: "#FFC53D", tint: "#FFF3D3", angle: 270,   size: 112, role: "Joy" },
  { id: "fear",   name: "Fear",   color: "#A78BFA", tint: "#EDE6FE", angle: 321.4, size: 108, role: "Caution" },
  { id: "buzzy",  name: "Buzzy",  color: "#FF6B4A", tint: "#FFE4DC", angle: 12.9,  size: 110, role: "Drive" },
  { id: "bubble", name: "Bubble", color: "#F97316", tint: "#FFEDD9", angle: 64.3,  size: 108, role: "Creativity" },
  { id: "dozy",   name: "Dozy",   color: "#6C7A96", tint: "#E4E8F2", angle: 115.7, size: 108, role: "Rest" },
  { id: "zen",    name: "Zen",    color: "#5FD4C4", tint: "#DFF9F4", angle: 167.1, size: 110, role: "Peace" },
  { id: "tear",   name: "Tear",   color: "#4A90D9", tint: "#DCEBFB", angle: 218.6, size: 108, role: "Empathy" },
];

const WISEY = { id: "wisey", name: "Wisey", color: "#C9A857", tint: "#FBF3D9", size: 150, role: "Wisdom" };

// Personality-driven debate stances (shown before topic submitted)
const IDLE_LINES = {
  cheer:  "Ready to find the bright side! 🌟",
  fear:   "Let's think about the risks first…",
  buzzy:  "Don't hold back — say it loud!",
  bubble: "Oh! I have so many ideas already!",
  dozy:   "Can we keep this brief? 😴",
  zen:    "Let's breathe and stay balanced.",
  tear:   "I just want everyone to feel heard.",
  wisey:  "Speak your mind. I'll hear all sides.",
};

function seatPos(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + RX * Math.cos(rad), y: CY + RY * Math.sin(rad) };
}

// Is the seat on the top half? (angle in 180–360 range = y above center)
function isTop(angle) {
  const a = ((angle % 360) + 360) % 360;
  return a > 180 && a < 360;
}

export default function DebatePage() {
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const [topic, setTopic] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | loading | debating
  const [bubbles, setBubbles] = useState(IDLE_LINES);
  const [speaking, setSpeaking] = useState(null);
  const inputRef = useRef(null);
  const seqRef = useRef(null);

  useEffect(() => {
    const upd = () =>
      setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  async function startDebate() {
    if (!topic.trim() || phase === "loading") return;
    setPhase("loading");
    setBubbles(Object.fromEntries(
      [...SEATS.map(s => s.id), "wisey"].map(id => [id, "thinking…"])
    ));

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (data.responses) {
        setPhase("debating");
        setBubbles(data.responses);
        // Animate one character speaking at a time
        const order = [...SEATS.map(s => s.id), "wisey"];
        let i = 0;
        function next() {
          if (i >= order.length) { setSpeaking(null); return; }
          setSpeaking(order[i++]);
          seqRef.current = setTimeout(next, 2200);
        }
        next();
      }
    } catch {
      setBubbles(IDLE_LINES);
      setPhase("idle");
    }
  }

  function reset() {
    clearTimeout(seqRef.current);
    setTopic("");
    setPhase("idle");
    setBubbles(IDLE_LINES);
    setSpeaking(null);
  }

  return (
    <>
      <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes popIn { from{opacity:0;transform:scale(.8) translateY(8px)} to{opacity:1;transform:none} }
        @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,87,0)} 50%{box-shadow:0 0 24px 6px rgba(201,168,87,.3)} }
        .seat-char { transition: transform .2s; cursor: default; }
        .seat-char.speaking { transform: scale(1.08) translateY(-6px); }
        .bubble-pop { animation: popIn .3s cubic-bezier(.34,1.56,.64,1) both; }
        .btn-start:hover { transform: translateY(-2px) scale(1.02); }
        .btn-start { transition: transform .2s, box-shadow .2s; }
        .thinking-dot::after { content: ''; animation: pulse 1s infinite; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0,
        background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif",
      }}>
        <div style={{
          position: "relative", width: 1600, height: 900, flex: "none",
          transform: `scale(${scale})`, transformOrigin: "center center",
          overflow: "hidden",
        }}>

          {/* ── Top bar ── */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 72,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 36px", borderBottom: "1px solid rgba(0,0,0,.06)", zIndex: 30,
            background: "rgba(255,253,240,.92)", backdropFilter: "blur(8px)",
          }}>
            <button onClick={() => router.push("/home")} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 18px", borderRadius: 30,
              background: "#f5f5f5", border: "1px solid #e8e8e8",
              cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#555",
            }}>← Back</button>

            <div style={{ fontSize: 28, fontWeight: 800, color: INK, letterSpacing: .5,
              position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
              <span style={{ color: "#ffb703" }}>Emo</span>chi{" "}
              <span style={{ color: "#C9A857", fontSize: 22 }}>⚖ Debate Room</span>
            </div>

            {phase === "debating" && (
              <button onClick={reset} style={{
                padding: "8px 20px", borderRadius: 30,
                background: "#f5f5f5", border: "1px solid #e8e8e8",
                cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#555",
              }}>New Topic</button>
            )}
          </div>

          {/* ── Table ── */}
          <div style={{
            position: "absolute",
            left: CX - RX - 20,
            top: CY - RY - 20,
            width: (RX + 20) * 2,
            height: (RY + 20) * 2,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 40% 35%, #2e2414 0%, #1a1208 60%, #110d06 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,.35), inset 0 2px 8px rgba(255,255,255,.06)",
            border: "6px solid #3d2e12",
          }} />
          {/* Table inner ring highlight */}
          <div style={{
            position: "absolute",
            left: CX - RX + 18,
            top: CY - RY + 18,
            width: (RX - 18) * 2,
            height: (RY - 18) * 2,
            borderRadius: "50%",
            border: "2px solid rgba(201,168,87,.18)",
            pointerEvents: "none",
          }} />

          {/* ── Wisey in the CENTER ── */}
          <div style={{
            position: "absolute",
            left: CX - WISEY.size * 0.55,
            top: CY - WISEY.size * 0.92,
            zIndex: 20,
            animation: "glow 3s ease-in-out infinite",
            borderRadius: "50%",
          }}>
            {/* Glow ring behind Wisey */}
            <div style={{
              position: "absolute", inset: -16,
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${WISEY.color}33 0%, transparent 70%)`,
            }} />
            <div style={{ position: "relative", width: WISEY.size * 1.1, height: WISEY.size * 1.3 }}>
              <Image src="/idle/wisey.png" alt="Wisey" fill style={{ objectFit: "contain" }} priority />
            </div>
            {/* Wisey label */}
            <div style={{
              textAlign: "center", marginTop: -8,
              fontSize: 12, fontWeight: 800, color: WISEY.color, letterSpacing: 2,
              textTransform: "uppercase",
            }}>Wisey · Mediator</div>
            {/* Wisey speech bubble */}
            {bubbles.wisey && (
              <div key={bubbles.wisey} className="bubble-pop" style={{
                position: "absolute", bottom: "110%", left: "50%",
                transform: "translateX(-50%)",
                background: "#fff",
                border: `2px solid ${WISEY.color}`,
                borderRadius: 14,
                padding: "8px 14px",
                fontSize: 12, fontWeight: 600, color: INK,
                whiteSpace: "nowrap", maxWidth: 220,
                whiteSpace: "normal", textAlign: "center",
                boxShadow: `0 4px 18px ${WISEY.color}33`,
                zIndex: 40,
              }}>
                {bubbles.wisey === "thinking…" ? <ThinkingDots /> : bubbles.wisey}
                <div style={{
                  position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
                  borderTop: `8px solid ${WISEY.color}`,
                }} />
              </div>
            )}
          </div>

          {/* ── Seated characters ── */}
          {SEATS.map((seat) => {
            const { x, y } = seatPos(seat.angle);
            const top = isTop(seat.angle);
            const bubble = bubbles[seat.id];
            const isSpeak = speaking === seat.id;

            // Position image so feet touch the ellipse edge
            const iW = seat.size * 0.85;
            const iH = seat.size;
            const imgLeft = x - iW / 2;
            const imgTop = top ? y - iH : y;

            // Bubble above head (top seats) or below feet (bottom seats)
            const bubbleBottom = top
              ? iH + 14
              : undefined;
            const bubbleTop = !top ? iH + 14 : undefined;

            return (
              <div key={seat.id} style={{ position: "absolute", left: imgLeft, top: imgTop, zIndex: 15 }}>
                {/* Character image */}
                <div className={`seat-char${isSpeak ? " speaking" : ""}`}
                  style={{
                    position: "relative", width: iW, height: iH,
                    filter: `drop-shadow(0 8px 16px rgba(0,0,0,.2))`,
                    animation: isSpeak ? "floatUp 1.2s ease-in-out infinite" : "none",
                  }}
                >
                  <Image src={`/idle/${seat.id}.png`} alt={seat.name} fill style={{ objectFit: "contain" }} />
                </div>

                {/* Name tag */}
                <div style={{
                  textAlign: "center", marginTop: top ? 2 : -6,
                  fontSize: 10, fontWeight: 800,
                  color: seat.color, letterSpacing: 1.5, textTransform: "uppercase",
                }}>{seat.name}</div>

                {/* Speech bubble */}
                {bubble && (
                  <div key={bubble} className="bubble-pop" style={{
                    position: "absolute",
                    bottom: bubbleBottom,
                    top: bubbleTop,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: isSpeak ? seat.tint : "#fff",
                    border: `2px solid ${seat.color}`,
                    borderRadius: 12,
                    padding: "7px 12px",
                    fontSize: 11, fontWeight: 600, color: INK,
                    width: 160, textAlign: "center",
                    boxShadow: isSpeak
                      ? `0 4px 20px ${seat.color}55`
                      : `0 2px 10px rgba(0,0,0,.08)`,
                    zIndex: 40,
                    transition: "background .3s, box-shadow .3s",
                    lineHeight: 1.4,
                  }}>
                    {bubble === "thinking…" ? <ThinkingDots /> : bubble}
                    {/* Tail */}
                    <div style={{
                      position: "absolute",
                      ...(top
                        ? { bottom: -8, left: "50%", transform: "translateX(-50%)",
                            borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                            borderTop: `8px solid ${seat.color}` }
                        : { top: -8, left: "50%", transform: "translateX(-50%)",
                            borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                            borderBottom: `8px solid ${seat.color}` }),
                      width: 0, height: 0,
                    }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Bottom input panel ── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 110,
            background: "rgba(255,253,240,.95)", backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(0,0,0,.07)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
            padding: "0 60px", zIndex: 30,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#aaa", whiteSpace: "nowrap" }}>
              ⚖️ Topic:
            </div>
            <input
              ref={inputRef}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && startDebate()}
              disabled={phase !== "idle"}
              placeholder="Type a topic or situation to debate..."
              style={{
                flex: 1, maxWidth: 700,
                padding: "14px 22px", borderRadius: 40,
                border: "2px solid #e8e8e8", fontSize: 15, fontWeight: 600,
                color: INK, background: "#fafafa", outline: "none",
                fontFamily: "inherit",
                transition: "border-color .2s",
              }}
              onFocus={e => e.target.style.borderColor = "#C9A857"}
              onBlur={e => e.target.style.borderColor = "#e8e8e8"}
            />
            <button
              className="btn-start"
              onClick={startDebate}
              disabled={!topic.trim() || phase !== "idle"}
              style={{
                padding: "14px 36px", borderRadius: 40,
                background: topic.trim() && phase === "idle"
                  ? "linear-gradient(135deg,#1a1a2e,#2e1f5e)"
                  : "#e8e8e8",
                border: topic.trim() && phase === "idle"
                  ? "1.5px solid rgba(201,168,87,.4)"
                  : "none",
                cursor: topic.trim() && phase === "idle" ? "pointer" : "not-allowed",
                color: topic.trim() && phase === "idle" ? "#f7d774" : "#aaa",
                fontWeight: 800, fontSize: 15,
                fontFamily: "inherit", letterSpacing: 1,
                boxShadow: topic.trim() && phase === "idle"
                  ? "0 4px 20px rgba(26,26,46,.25)"
                  : "none",
                whiteSpace: "nowrap",
              }}
            >
              {phase === "loading" ? "Thinking…" : "Start Debate ⚖️"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

function ThinkingDots() {
  return (
    <span style={{ letterSpacing: 2 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          display: "inline-block",
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}>·</span>
      ))}
    </span>
  );
}
