"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const INK = "#1a1a2e";

const PREVIEW_CHARS = [
  { file: "Cheer.png",  color: "#FFC53D", x: -60,  y: 0,   rotate: -8,  scale: 0.82 },
  { file: "Tear.png",   color: "#4A90D9", x: -30,  y: 20,  rotate: -3,  scale: 0.78 },
  { file: "Wisey.png",  color: "#C9A857", x: 0,    y: 0,   rotate: 0,   scale: 1.0  },
  { file: "Zen.png",    color: "#5FD4C4", x: 30,   y: 20,  rotate: 3,   scale: 0.78 },
  { file: "Bubble.png", color: "#F97316", x: 60,   y: 0,   rotate: 8,   scale: 0.82 },
];

const FEATURES = [
  {
    icon: "🗣️",
    title: "Let your feelings debate",
    desc: "Your emotions aren't chaos — they're a crew with different points of view. Give them a voice.",
  },
  {
    icon: "🦉",
    title: "Guided by Wisey",
    desc: "Wisey keeps the balance. Every debate ends with clarity, not more confusion.",
  },
  {
    icon: "📊",
    title: "Track how you feel",
    desc: "See your mood, sleep, and energy patterns over time — all in one place.",
  },
];

export default function LandingPage() {
  const router  = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <>
      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .hero-char { animation: floatB 4s ease-in-out infinite; }
        .hero-char-side { animation: floatA 3.5s ease-in-out infinite; }
        .fade-up { animation: fadeUp .6s cubic-bezier(.22,1,.36,1) both; }
        .btn-primary:hover { filter: brightness(1.06); transform: translateY(-2px); }
        .btn-secondary:hover { background: #f0f0f0 !important; transform: translateY(-2px); }
        .btn-primary, .btn-secondary { transition: filter .18s, transform .18s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.08); }
        .feature-card { transition: transform .22s, box-shadow .22s; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 55%,#fffef5 100%)",
        fontFamily: "var(--font-baloo),'Baloo 2',sans-serif",
        color: INK,
        overflowX: "hidden",
      }}>

        {/* ── NAV ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 48px", height: 68,
          background: "rgba(255,253,240,.88)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,.06)",
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: .3 }}>
            <span style={{ color: "#ffb703" }}>Emo</span>chi
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn-secondary"
              onClick={() => router.push("/login")}
              style={{
                padding: "9px 22px", borderRadius: 30,
                background: "transparent", border: "1.5px solid #ddd",
                fontSize: 14, fontWeight: 700, cursor: "pointer", color: INK,
              }}
            >Log in</button>
            <button
              className="btn-primary"
              onClick={() => router.push("/signup")}
              style={{
                padding: "9px 22px", borderRadius: 30,
                background: "linear-gradient(135deg,#1a1a2e,#2e1f5e)",
                border: "1.5px solid rgba(201,168,87,.3)",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                color: "#f7d774",
              }}
            >Get started</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          paddingTop: 68, paddingBottom: 40,
          textAlign: "center", position: "relative",
        }}>
          {/* Character cluster */}
          <div className="fade-up" style={{
            animationDelay: ".1s",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            marginBottom: 40, height: 260, position: "relative",
          }}>
            {PREVIEW_CHARS.map((c, i) => (
              <div
                key={c.file}
                className={i === 2 ? "hero-char" : "hero-char-side"}
                style={{
                  position: "relative",
                  width:  Math.round(200 * c.scale),
                  height: Math.round(240 * c.scale),
                  marginLeft: i === 0 ? 0 : -Math.round(200 * c.scale * 0.36),
                  zIndex: i === 2 ? 5 : 3 - Math.abs(i - 2),
                  animationDelay: `${i * 0.3}s`,
                  transform: `rotate(${c.rotate}deg)`,
                  filter: `drop-shadow(0 12px 20px rgba(0,0,0,.13))`,
                }}
              >
                <Image src={`/agents/${c.file}`} alt="" fill style={{ objectFit: "contain" }} />
              </div>
            ))}
          </div>

          {/* Headline */}
          <h1 className="fade-up" style={{
            animationDelay: ".22s",
            fontSize: "clamp(40px,5.5vw,72px)",
            fontWeight: 800, lineHeight: 1.12, margin: "0 0 18px",
            maxWidth: 760,
          }}>
            Talk to your feelings.<br />
            <span style={{ color: "#C9A857" }}>Actually listen.</span>
          </h1>

          <p className="fade-up" style={{
            animationDelay: ".34s",
            fontSize: "clamp(16px,1.8vw,20px)", color: "#666",
            fontWeight: 600, maxWidth: 520, margin: "0 0 36px", lineHeight: 1.6,
          }}>
            Emochi turns your emotions into a room of characters who debate, support,
            and help you understand how you really feel.
          </p>

          <div className="fade-up" style={{ animationDelay: ".44s", display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="btn-primary"
              onClick={() => router.push("/signup")}
              style={{
                padding: "14px 36px", borderRadius: 30, fontSize: 16, fontWeight: 800,
                background: "linear-gradient(135deg,#1a1a2e,#2e1f5e)",
                border: "1.5px solid rgba(201,168,87,.3)",
                cursor: "pointer", color: "#f7d774", letterSpacing: .5,
              }}
            >Start for free</button>
            <button
              className="btn-secondary"
              onClick={() => router.push("/login")}
              style={{
                padding: "14px 36px", borderRadius: 30, fontSize: 16, fontWeight: 700,
                background: "#fff", border: "1.5px solid #e0e0e0",
                cursor: "pointer", color: INK,
              }}
            >Log in</button>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{
          padding: "80px 48px 100px",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            fontSize: "clamp(11px,1vw,13px)", fontWeight: 700,
            letterSpacing: 3, color: "#C9A857", marginBottom: 12, textTransform: "uppercase",
          }}>How it works</div>
          <h2 style={{
            fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800,
            margin: "0 0 56px", textAlign: "center",
          }}>Your inner world, finally heard</h2>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 24, width: "100%", maxWidth: 900,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: "#fff", borderRadius: 20, padding: "28px 26px",
                border: "1px solid rgba(0,0,0,.06)",
                boxShadow: "0 4px 16px rgba(0,0,0,.04)",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, marginBottom: 16,
                  background: "linear-gradient(135deg,#fffbea,#fff3c4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: "#777", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          padding: "24px 48px",
          borderTop: "1px solid rgba(0,0,0,.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          color: "#bbb", fontSize: 13, fontWeight: 600,
        }}>
          <div><span style={{ color: "#ffb703" }}>Emo</span>chi © 2025</div>
          <div>Talk to your feelings.</div>
        </footer>
      </div>
    </>
  );
}
