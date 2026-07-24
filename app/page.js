"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

const MOODLINGS = [
  { key: "cheer",  color: "#FFC53D", name: "Cheer",  quote: "What could go right?",           file: "Cheer.png",  animDelay: "0s"    },
  { key: "fear",   color: "#A78BFA", name: "Fear",   quote: "Is it safe?",                    file: "Fear.png",   animDelay: "0.3s"  },
  { key: "buzzy",  color: "#FF6B4A", name: "Buzzy",  quote: "Can we handle this now?",        file: "Buzzy.png",  animDelay: "0.6s"  },
  { key: "tear",   color: "#4A90D9", name: "Tear",   quote: "How do we really feel?",         file: "Tear.png",   animDelay: "0.9s"  },
  { key: "zen",    color: "#5FD4C4", name: "Zen",    quote: "Let's slow down.",               file: "Zen.png",    animDelay: "1.2s"  },
  { key: "bubble", color: "#F97316", name: "Bubble", quote: "Who can we do this with?",       file: "Bubble.png", animDelay: "1.5s"  },
  { key: "dozy",   color: "#6C7A96", name: "Dozy",   quote: "Do we need a break?",            file: "Dozy.png",   animDelay: "1.8s"  },
  { key: "wisey",  color: "#C9A857", name: "Wisey",  quote: "What's the most balanced step?", file: "Wisey.png",  animDelay: "2.1s"  },
];

const NAV_ITEMS = [
  { icon: "📋", label: "Missions",   badge: null  },
  { icon: "🎪", label: "Events",     badge: "!"   },
  { icon: "🏆", label: "Ranked",     badge: "!"   },
  { icon: "🥇", label: "Tournaments",badge: "!"   },
];

export default function Home() {
  const [selected, setSelected]   = useState(null);
  const [coins]                   = useState(1410);
  const [gems]                    = useState(33);
  const [stars, setStars]         = useState([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 3,
        dur: Math.random() * 2 + 2,
      }))
    );
  }, []);

  const active = selected !== null ? MOODLINGS[selected] : null;

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.8; }
          70%  { transform: scale(1.3); opacity: 0;   }
          100% { transform: scale(1.3); opacity: 0;   }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes badge-pop {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.2); }
        }
        @keyframes ground-glow {
          0%, 100% { opacity: 0.4; transform: scaleX(1); }
          50%       { opacity: 0.7; transform: scaleX(1.08); }
        }
        @keyframes cloud-drift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(60px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .char-float { animation: float 3s ease-in-out infinite; }
        .char-float-slow { animation: floatSlow 4s ease-in-out infinite; }
        .btn-hover:hover { transform: scale(1.06) translateY(-2px); filter: brightness(1.1); }
        .btn-hover { transition: transform .15s, filter .15s; }
        .play-btn:hover { transform: scale(1.08) translateY(-3px); filter: brightness(1.15); box-shadow: 0 12px 40px rgba(255,197,61,0.7) !important; }
        .play-btn { transition: transform .18s, filter .18s, box-shadow .18s; }
        .char-card:hover .char-name-tag { opacity: 1 !important; transform: translateY(0) !important; }
        .char-card:hover { filter: brightness(1.08) drop-shadow(0 0 16px currentColor); }
        .char-card { transition: filter .2s; cursor: pointer; }
      `}</style>

      <div style={{
        width: "100vw", minHeight: "100vh",
        background: "linear-gradient(180deg, #3a1878 0%, #6b2fa0 25%, #c0568a 55%, #f4914a 80%, #f5c26b 100%)",
        position: "relative", overflow: "hidden",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        display: "flex", flexDirection: "column",
      }}>

        {/* ── Starfield ── */}
        {stars.map(s => (
          <div key={s.id} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "#fff",
            animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
            pointerEvents: "none",
          }} />
        ))}

        {/* ── Moon ── */}
        <div style={{
          position: "absolute", top: "4%", left: "50%", transform: "translateX(-50%)",
          width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #e8eaf0, #b0b8d0)",
          boxShadow: "0 0 60px 20px rgba(200,210,255,0.35)",
          animation: "floatSlow 8s ease-in-out infinite",
        }} />

        {/* ── Clouds ── */}
        {[{ l: "5%", t: "22%", op: 0.25, s: 1 }, { l: "75%", t: "18%", op: 0.2, s: 0.8 }].map((c, i) => (
          <div key={i} style={{
            position: "absolute", left: c.l, top: c.t,
            width: 120, height: 50, borderRadius: 50,
            background: "rgba(255,255,255,0.18)",
            opacity: c.op, transform: `scale(${c.s})`,
            animation: `cloud-drift ${12 + i * 4}s ease-in-out infinite alternate`,
          }} />
        ))}

        {/* ── Ground platform ── */}
        <div style={{
          position: "absolute", bottom: "12%", left: "50%",
          transform: "translateX(-50%)",
          width: "85%", height: 60, borderRadius: "50%",
          background: "rgba(255,180,80,0.18)",
          filter: "blur(18px)",
          animation: "ground-glow 4s ease-in-out infinite",
        }} />

        {/* ══════════════════════ TOP BAR ══════════════════════ */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px 0", flexShrink: 0, position: "relative", zIndex: 10,
        }}>
          {/* Left: player card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(0,0,0,0.45)", borderRadius: 50,
            padding: "6px 14px 6px 6px",
            border: "2px solid rgba(255,255,255,0.2)",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "linear-gradient(135deg,#ffc53d,#f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.6rem", border: "2px solid #ffc53d",
            }}>🦁</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>You</div>
              <div style={{ fontSize: "0.7rem", color: "#aaa" }}>Level 1</div>
              <div style={{
                width: 90, height: 5, background: "rgba(255,255,255,0.15)",
                borderRadius: 3, marginTop: 2,
              }}>
                <div style={{ width: "40%", height: "100%", background: "#ffc53d", borderRadius: 3 }} />
              </div>
            </div>
          </div>

          {/* Center: logo */}
          <div style={{
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.5px",
            textShadow: "0 3px 12px rgba(0,0,0,0.5)",
            color: "#fff",
          }}>
            <span style={{ color: "#ffc53d" }}>Emo</span>chi
          </div>

          {/* Right: currency */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <CurrencyChip icon="🪙" value={coins} color="#ffc53d" />
            <CurrencyChip icon="💎" value={gems} color="#5FD4C4" />
            <button style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)",
              color: "#fff", fontSize: "1.1rem", cursor: "pointer",
            }}>⚙️</button>
          </div>
        </div>

        {/* ══════════════════════ SIDE LEFT ══════════════════════ */}
        <div style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-55%)",
          display: "flex", flexDirection: "column", gap: 14, zIndex: 10,
        }}>
          <SideBtn icon="🎁" label="Free Prizes" color="#ffc53d" />
          <SideBtn icon="🎨" label="Customize"  color="#A78BFA" />
        </div>

        {/* ══════════════════════ SIDE RIGHT ══════════════════════ */}
        <div style={{
          position: "absolute", right: 16, top: "50%", transform: "translateY(-55%)",
          display: "flex", flexDirection: "column", gap: 14, zIndex: 10,
        }}>
          <SideBtn icon="👥" label="Friends" color="#5FD4C4" />
          <SideBtn icon="🎉" label="Party"   color="#F97316" badge />
        </div>

        {/* ══════════════════════ CHARACTERS STAGE ══════════════════════ */}
        <div style={{
          flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center",
          padding: "0 100px", gap: 0, position: "relative", zIndex: 5,
          paddingBottom: "calc(12% + 60px)",
        }}>
          {MOODLINGS.map((m, i) => (
            <CharacterFigure
              key={m.key}
              moodling={m}
              index={i}
              total={MOODLINGS.length}
              isSelected={selected === i}
              onClick={() => setSelected(selected === i ? null : i)}
            />
          ))}
        </div>

        {/* ── Tooltip for selected character ── */}
        {active && (
          <div style={{
            position: "absolute", left: "50%", top: "58%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.75)",
            border: `2px solid ${active.color}`,
            borderRadius: 16, padding: "10px 20px",
            color: "#fff", textAlign: "center", zIndex: 20,
            backdropFilter: "blur(8px)",
            animation: "slide-up .2s ease",
          }}>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: active.color }}>{active.name}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: 2 }}>&ldquo;{active.quote}&rdquo;</div>
          </div>
        )}

        {/* ══════════════════════ BOTTOM BAR ══════════════════════ */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, padding: "10px 20px 16px",
          position: "relative", zIndex: 10, flexShrink: 0,
          flexWrap: "wrap",
        }}>
          {/* Pass card */}
          <div style={{
            background: "linear-gradient(135deg,#7a5a00,#b88a00)",
            border: "2px solid #ffc53d", borderRadius: 16,
            padding: "8px 14px", display: "flex", alignItems: "center", gap: 10,
            minWidth: 160,
          }}>
            <span style={{ fontSize: "1.5rem" }}>⭐</span>
            <div>
              <div style={{ color: "#ffc53d", fontWeight: 800, fontSize: "0.75rem" }}>EMOCHI PASS</div>
              <div style={{ color: "#fff", fontSize: "0.7rem" }}>0 / 800</div>
              <div style={{ width: 90, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 2 }}>
                <div style={{ width: "0%", height: "100%", background: "#ffc53d", borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          {NAV_ITEMS.map(n => (
            <NavBtn key={n.label} icon={n.icon} label={n.label} badge={n.badge} />
          ))}

          {/* PLAY */}
          <button className="play-btn" style={{
            background: "linear-gradient(135deg,#ffc53d,#f97316)",
            border: "3px solid rgba(255,255,255,0.4)",
            borderRadius: 18, padding: "12px 44px",
            fontWeight: 900, fontSize: "1.5rem",
            color: "#3a2a00", cursor: "pointer",
            boxShadow: "0 8px 28px rgba(255,197,61,0.55)",
            letterSpacing: 2,
          }}>
            PLAY
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function CharacterFigure({ moodling, index, total, isSelected, onClick }) {
  const centerOffset = (index - (total - 1) / 2);
  const zIndex       = total - Math.abs(index - (total - 1) / 2);
  const scale        = 1 - Math.abs(centerOffset) * 0.04;
  const yShift       = Math.abs(centerOffset) * 6;

  return (
    <div
      className="char-card"
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        position: "relative", zIndex, flex: "0 0 auto",
        transform: `scale(${scale}) translateY(${yShift}px)`,
        marginLeft: index === 0 ? 0 : -14,
      }}
    >
      {/* Pulse ring on selection */}
      {isSelected && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%",
          transform: "translateX(-50%)",
          width: 80, height: 80, borderRadius: "50%",
          border: `3px solid ${moodling.color}`,
          animation: "pulse-ring 1.2s ease-out infinite",
        }} />
      )}

      {/* Character image */}
      <div
        className="char-float"
        style={{ animationDelay: moodling.animDelay, position: "relative" }}
      >
        <Image
          src={`/agents/${moodling.file}`}
          alt={moodling.name}
          width={110}
          height={110}
          style={{
            objectFit: "contain",
            filter: isSelected
              ? `drop-shadow(0 0 18px ${moodling.color})`
              : "drop-shadow(0 8px 12px rgba(0,0,0,0.4))",
            transition: "filter .2s",
          }}
          priority
        />
      </div>

      {/* Shadow ellipse */}
      <div style={{
        width: 60, height: 12, borderRadius: "50%",
        background: "rgba(0,0,0,0.28)", filter: "blur(4px)",
        marginTop: -6,
      }} />

      {/* Name tag — revealed on hover via CSS */}
      <div className="char-name-tag" style={{
        position: "absolute", bottom: -28, left: "50%",
        transform: "translateX(-50%) translateY(6px)",
        background: moodling.color,
        color: "#1a1a1a", fontWeight: 800, fontSize: "0.72rem",
        borderRadius: 20, padding: "3px 10px",
        whiteSpace: "nowrap",
        opacity: isSelected ? 1 : 0,
        transition: "opacity .2s, transform .2s",
      }}>
        {moodling.name}
      </div>
    </div>
  );
}

function CurrencyChip({ icon, value, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(0,0,0,0.45)", border: `2px solid ${color}55`,
      borderRadius: 50, padding: "5px 12px",
    }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{value.toLocaleString()}</span>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, color: "#1a1a1a",
      }}>+</div>
    </div>
  );
}

function SideBtn({ icon, label, color, badge }) {
  return (
    <div className="btn-hover" style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
        border: `2px solid ${color}`,
        boxShadow: `0 4px 16px ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.7rem", position: "relative",
      }}>
        {icon}
        {badge && (
          <div style={{
            position: "absolute", top: -6, right: -6,
            width: 18, height: 18, borderRadius: "50%",
            background: "#ff3b3b", border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.65rem", fontWeight: 900, color: "#fff",
            animation: "badge-pop 1.5s ease-in-out infinite",
          }}>!</div>
        )}
      </div>
      <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700,
        textShadow: "0 1px 4px rgba(0,0,0,0.6)", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

function NavBtn({ icon, label, badge }) {
  return (
    <div className="btn-hover" style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      cursor: "pointer", minWidth: 58,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "rgba(255,255,255,0.15)",
        border: "2px solid rgba(255,255,255,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.6rem", position: "relative",
        backdropFilter: "blur(4px)",
      }}>
        {icon}
        {badge && (
          <div style={{
            position: "absolute", top: -6, right: -6,
            width: 18, height: 18, borderRadius: "50%",
            background: "#ff3b3b", border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.65rem", fontWeight: 900, color: "#fff",
            animation: "badge-pop 1.5s ease-in-out infinite",
          }}>!</div>
        )}
      </div>
      <span style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 700,
        textShadow: "0 1px 4px rgba(0,0,0,0.6)", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}
