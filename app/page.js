import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

const INK = "#1a1a2e";

const CHARS = [
  {
    id: "cheer", name: "Cheer", color: "#FFC53D", file: "Cheer.png", isMain: false, imgH: 270, level: 4,
    role: "Joy & Enthusiasm",
    desc: "Your inner cheerleader. Cheer finds the bright side in any situation and keeps your spirits high when things feel heavy.",
    traits: ["Boosts motivation", "Celebrates every win", "Spreads positive energy", "Keeps you moving forward"],
  },
  {
    id: "fear", name: "Fear", color: "#A78BFA", file: "Fear.png", isMain: false, imgH: 270, level: 3,
    role: "Caution & Awareness",
    desc: "Fear isn't the enemy — they're your early-warning system. They spot danger before it arrives and keep you safe.",
    traits: ["Risk detection", "Protective instincts", "Heightens awareness", "Prepares for the unexpected"],
  },
  {
    id: "buzzy", name: "Buzzy", color: "#FF6B4A", file: "Buzzy.png", isMain: false, imgH: 270, level: 5,
    role: "Anger & Drive",
    desc: "Buzzy channels frustration into fuel. When things feel unfair, Buzzy steps up to set boundaries and push through.",
    traits: ["Sets clear limits", "Turns frustration into action", "Fights for what's right", "Raw, unstoppable energy"],
  },
  {
    id: "tear", name: "Tear", color: "#4A90D9", file: "Tear.png", isMain: false, imgH: 270, level: 3,
    role: "Sadness & Empathy",
    desc: "Tear helps you sit with what hurts. They process grief with grace and connect deeply to the feelings of others.",
    traits: ["Deep emotional processing", "Compassion for others", "Slows down to reflect", "Healing through feeling"],
  },
  {
    id: "wisey", name: "Wisey", color: "#C9A857", file: "Wisey.png", isMain: true, imgH: 360, level: 8, noLevel: true,
    role: "Wisdom & Balance",
    desc: "Wisey is your inner guide — the voice that weighs all sides before speaking. They keep the whole crew in harmony.",
    traits: ["Calm under pressure", "Sees the bigger picture", "Mediates conflicts", "Leads with reason and heart"],
  },
  {
    id: "zen", name: "Zen", color: "#5FD4C4", file: "Zen.png", isMain: false, imgH: 270, level: 6,
    role: "Peace & Mindfulness",
    desc: "Zen brings stillness to the storm. In moments of chaos, they guide you back to your breath and the present moment.",
    traits: ["Grounds racing thoughts", "Slows the spiral", "Finds calm in chaos", "Present-moment awareness"],
  },
  {
    id: "bubble", name: "Bubble", color: "#F97316", file: "Bubble.png", isMain: false, imgH: 270, level: 4,
    role: "Excitement & Creativity",
    desc: "Bubble overflows with ideas and curiosity. They turn ordinary moments into adventures and spark creative breakthroughs.",
    traits: ["Endless curiosity", "Creative problem-solving", "Contagious excitement", "Sees magic in the mundane"],
  },
  {
    id: "dozy", name: "Dozy", color: "#6C7A96", file: "Dozy.png", isMain: false, imgH: 270, level: 2,
    role: "Rest & Recovery",
    desc: "Dozy knows that rest is not laziness — it's repair. They remind you to recharge before you burn out completely.",
    traits: ["Prioritizes recovery", "Signals exhaustion early", "Slows the pace", "Protects your energy"],
  },
];

const STATS = [
  { icon: "🌙", label: "Sleep", short: "7.5h", pct: 94, color: "#8b5cf6" },
  { icon: "💼", label: "Work",  short: "6h",   pct: 79, color: "#f59e0b" },
  { icon: "😊", label: "Mood",  short: "😊",   pct: 88, color: "#22c55e" },
];

const FRIENDS = [
  { id: 1, name: "Pailin", emoji: "🐱", bg: "#6bd6c9", online: true,  mood: "😄 Great"  },
  { id: 2, name: "Min",    emoji: "🐰", bg: "#ffb15e", online: true,  mood: "😌 Calm"   },
  { id: 3, name: "Hein",   emoji: "🐶", bg: "#5ec8f7", online: true,  mood: "😴 Tired"  },
  { id: 4, name: "Sofia",  emoji: "🦊", bg: "#A78BFA", online: false, mood: "😢 Sad"    },
  { id: 5, name: "James",  emoji: "🐸", bg: "#5FD4C4", online: false, mood: "😐 Meh"    },
];

export default function Home() {
  const [scale, setScale]         = useState(1);
  const [friendsOpen, setFriends] = useState(false);
  const [hovChar, setHovChar]     = useState(null);
  const [charPopup, setCharPopup] = useState(null);
  const [profileOpen, setProfile] = useState(false);
  const [avatar, setAvatar]       = useState("wisey");
  const [userName, setUserName]   = useState("You");
  const [editName, setEditName]   = useState("You");
  const [editAvatar, setEditAvatar] = useState("wisey");

  useEffect(() => {
    const upd = () =>
      setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const currentChar = CHARS.find(c => c.id === avatar) ?? CHARS[4];
  const PANEL_W = 248;

  function openProfile() {
    setEditName(userName);
    setEditAvatar(avatar);
    setProfile(true);
  }

  function saveProfile() {
    setUserName(editName.trim() || "You");
    setAvatar(editAvatar);
    setProfile(false);
  }

  return (
    <>
      <style>{`
        @keyframes debateGlow {
          0%,100%{box-shadow:0 12px 36px rgba(26,26,46,.22),0 0 0 0 rgba(201,168,87,0)}
          50%{box-shadow:0 16px 44px rgba(26,26,46,.3),0 0 28px 6px rgba(201,168,87,.18)}
        }
        .btn-debate { animation: debateGlow 3.5s ease-in-out infinite; transition: transform .2s, box-shadow .2s; }
        .btn-debate:hover { transform: translateY(-3px) scale(1.025); }
        .char-node { transition: transform .22s cubic-bezier(.34,1.56,.64,1), filter .2s; cursor: pointer; }
        .char-node:hover { filter: drop-shadow(0 0 18px rgba(0,0,0,.13)) brightness(1.04); }
        .friend-row:hover { background: #f3f3f3 !important; }
        .avatar-pill:hover { filter: brightness(.96); }
        .picker-char:hover > div { outline: 2px solid #ccc; }
        .modal-overlay { animation: fadeIn .16s ease; }
        .modal-card   { animation: slideUp .2s cubic-bezier(.34,1.56,.64,1); }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(24px) scale(.97);opacity:0} to{transform:none;opacity:1} }
        .friends-panel { transition: transform .28s cubic-bezier(.4,0,.2,1), opacity .28s; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif",
      }}>
        <div style={{
          position: "relative", width: 1600, height: 900, flex: "none",
          transform: `scale(${scale})`, transformOrigin: "center center",
          overflow: "hidden", borderRadius: 20, background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
          boxShadow: "0 8px 40px rgba(0,0,0,.08)",
        }}>

          {/* ══ TOP NAV BAR ══ */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 80,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 36px", borderBottom: "1px solid #f0f0f0", zIndex: 30,
            background: "rgba(255,253,240,.92)", backdropFilter: "blur(8px)",
          }}>
            {/* Left: daily donut stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {STATS.map(s => <DonutStat key={s.label} stat={s} />)}
            </div>

            {/* Center: Logo */}
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: .5, color: INK, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
              <span style={{ color: "#ffb703" }}>Emo</span>chi
            </div>

            {/* Right: avatar pill + settings + friends toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Avatar pill */}
              <button
                className="avatar-pill"
                onClick={openProfile}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 14px 6px 6px", borderRadius: 40,
                  background: "#f8f8f8", border: "1.5px solid #ececec",
                  cursor: "pointer", transition: "filter .15s",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: currentChar.color + "22",
                  border: `2px solid ${currentChar.color}`,
                  position: "relative", overflow: "hidden", flexShrink: 0,
                  boxShadow: `0 2px 8px ${currentChar.color}44`,
                }}>
                  <Image src={`/agents/${currentChar.file}`} alt={currentChar.name} fill style={{ objectFit: "cover" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: INK, fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{userName}</div>
                  <div style={{ color: "#bbb", fontSize: 11 }}>Lv. 1  ·  edit profile</div>
                </div>
              </button>

              {/* Settings */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#f5f5f5", border: "1px solid #e8e8e8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, cursor: "pointer",
              }}>⚙️</div>

              {/* Friends toggle */}
              <button
                onClick={() => setFriends(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 30,
                  background: friendsOpen ? INK : "#f5f5f5",
                  border: "1px solid #e8e8e8",
                  cursor: "pointer", transition: "background .2s",
                }}
              >
                <span style={{ fontSize: 15 }}>👥</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: friendsOpen ? "#fff" : "#555" }}>
                  Friends
                </span>
                {FRIENDS.filter(f => f.online).length > 0 && (
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#22c55e", color: "#fff",
                    fontSize: 9, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{FRIENDS.filter(f => f.online).length}</span>
                )}
              </button>
            </div>
          </div>

          {/* ══ FRIENDS PANEL (hideable) ══ */}
          <div
            className="friends-panel"
            style={{
              position: "absolute", right: 0, top: 80, bottom: 0,
              width: PANEL_W,
              background: "#fafafa", borderLeft: "1px solid #f0f0f0",
              display: "flex", flexDirection: "column", zIndex: 20,
              transform: friendsOpen ? "translateX(0)" : `translateX(${PANEL_W}px)`,
              opacity: friendsOpen ? 1 : 0,
              pointerEvents: friendsOpen ? "auto" : "none",
            }}
          >
            <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: INK }}>Friends</div>
                <button onClick={() => setFriends(false)} style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#f0f0f0", border: "none", cursor: "pointer",
                  fontSize: 13, color: "#777",
                }}>✕</button>
              </div>
              <div style={{ color: "#bbb", fontSize: 12, marginTop: 2 }}>{FRIENDS.filter(f => f.online).length} online · {FRIENDS.length} total</div>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ padding: "10px 0" }}>
                <div style={{ padding: "4px 20px 6px", color: "#bbb", fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>ONLINE</div>
                {FRIENDS.filter(f => f.online).map(f => <FriendRow key={f.id} friend={f} />)}
              </div>
              <div style={{ padding: "4px 0" }}>
                <div style={{ padding: "4px 20px 6px", color: "#bbb", fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>OFFLINE</div>
                {FRIENDS.filter(f => !f.online).map(f => <FriendRow key={f.id} friend={f} offline />)}
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #f0f0f0" }}>
              <button style={{
                width: "100%", padding: "10px 0", borderRadius: 30,
                background: "linear-gradient(90deg,#ff8a3d,#ff5e7a)",
                border: "none", cursor: "pointer",
                color: "#fff", fontWeight: 700, fontSize: 13,
              }}>+ Add Friend</button>
            </div>
          </div>

          {/* ══ CHARACTERS GROUP ══ */}
          <div style={{
            position: "absolute",
            left: 0,
            right: friendsOpen ? PANEL_W : 0,
            bottom: 160,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            transition: "right .28s cubic-bezier(.4,0,.2,1)",
          }}>
            {CHARS.map(c => (
              <CharNode
                key={c.id}
                char={c}
                hovered={hovChar === c.id}
                onEnter={() => setHovChar(c.id)}
                onLeave={() => setHovChar(null)}
                onClick={() => setCharPopup(c)}
              />
            ))}
          </div>

          {/* ══ DEBATE BUTTON ══ */}
          <div style={{
            position: "absolute", left: 0, right: friendsOpen ? PANEL_W : 0,
            bottom: 36, display: "flex", justifyContent: "center",
            transition: "right .28s cubic-bezier(.4,0,.2,1)",
          }}>
            <button className="btn-debate" style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "17px 52px", borderRadius: 16,
              background: "linear-gradient(135deg,#1a1a2e 0%,#2e1f5e 100%)",
              border: "1.5px solid rgba(201,168,87,.28)",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 18 }}>⚖️</span>
              <span style={{
                background: "linear-gradient(90deg,#f7d774,#c9a857)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                fontWeight: 800, fontSize: 20, letterSpacing: 4,
              }}>DEBATE</span>
            </button>
          </div>

          {/* ══ CHARACTER POPUP ══ */}
          {charPopup && (
            <div
              className="modal-overlay"
              onClick={() => setCharPopup(null)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,.35)", zIndex: 50,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div
                className="modal-card"
                onClick={e => e.stopPropagation()}
                style={{
                  width: 620, background: "#fff", borderRadius: 28,
                  boxShadow: "0 24px 60px rgba(0,0,0,.18)",
                  overflow: "hidden", display: "flex",
                }}
              >
                {/* Left: character image */}
                <div style={{
                  width: 220, flexShrink: 0,
                  background: `linear-gradient(160deg,${charPopup.color}22,${charPopup.color}44)`,
                  display: "flex", alignItems: "flex-end", justifyContent: "center",
                  padding: "0 0 0 0",
                  position: "relative",
                }}>
                  <div style={{ position: "relative", width: 180, height: 240 }}>
                    <Image src={`/agents/${charPopup.file}`} alt={charPopup.name} fill style={{ objectFit: "contain" }} />
                  </div>
                </div>

                {/* Right: info */}
                <div style={{ flex: 1, padding: "28px 28px 24px" }}>
                  <button onClick={() => setCharPopup(null)} style={{
                    float: "right", width: 30, height: 30, borderRadius: "50%",
                    background: "#f4f4f4", border: "none", cursor: "pointer",
                    fontSize: 13, color: "#777",
                  }}>✕</button>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: INK }}>{charPopup.name}</div>
                    {!charPopup.noLevel && (
                      <div style={{
                        padding: "3px 12px", borderRadius: 30,
                        background: charPopup.color + "22", color: charPopup.color,
                        fontSize: 12, fontWeight: 700,
                      }}>Lv. {charPopup.level}</div>
                    )}
                  </div>

                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", borderRadius: 20,
                    background: charPopup.color, color: "#fff",
                    fontSize: 11, fontWeight: 700, marginBottom: 14,
                  }}>
                    ✦ {charPopup.role}
                  </div>

                  <div style={{ color: "#555", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
                    {charPopup.desc}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {charPopup.traits.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: charPopup.color, flexShrink: 0,
                        }} />
                        <span style={{ color: INK, fontSize: 13, fontWeight: 600 }}>{t}</span>
                      </div>
                    ))}
                  </div>

                  {/* XP bar — hidden for Wisey */}
                  {!charPopup.noLevel && (
                    <div style={{ marginTop: 22 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#aaa", fontSize: 11, fontWeight: 600 }}>XP Progress</span>
                        <span style={{ color: "#aaa", fontSize: 11, fontWeight: 600 }}>
                          {charPopup.level * 120} / {(charPopup.level + 1) * 120}
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 6, background: "#f0f0f0", overflow: "hidden" }}>
                        <div style={{
                          width: `${(charPopup.level % 2 === 0 ? 60 : 35)}%`,
                          height: "100%", borderRadius: 6,
                          background: `linear-gradient(90deg,${charPopup.color},${charPopup.color}99)`,
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ PROFILE MODAL ══ */}
          {profileOpen && (
            <div
              className="modal-overlay"
              onClick={() => setProfile(false)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,.35)", zIndex: 50,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div
                className="modal-card"
                onClick={e => e.stopPropagation()}
                style={{
                  width: 520, background: "#fff", borderRadius: 28,
                  boxShadow: "0 24px 60px rgba(0,0,0,.18)",
                  padding: "28px 28px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>Edit Profile</div>
                  <button onClick={() => setProfile(false)} style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "#f4f4f4", border: "none", cursor: "pointer",
                    fontSize: 13, color: "#777",
                  }}>✕</button>
                </div>

                {/* Current avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: (CHARS.find(c => c.id === editAvatar)?.color ?? "#ccc") + "22",
                    border: `3px solid ${CHARS.find(c => c.id === editAvatar)?.color ?? "#ccc"}`,
                    position: "relative", overflow: "hidden", flexShrink: 0,
                    boxShadow: `0 4px 16px ${CHARS.find(c => c.id === editAvatar)?.color ?? "#ccc"}44`,
                  }}>
                    <Image
                      src={`/agents/${CHARS.find(c => c.id === editAvatar)?.file}`}
                      alt="avatar" fill style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#aaa", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>DISPLAY NAME</div>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      maxLength={24}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: 12,
                        border: "1.5px solid #e8e8e8", fontSize: 15, fontWeight: 700,
                        color: INK, outline: "none", fontFamily: "inherit",
                        background: "#fafafa",
                      }}
                    />
                  </div>
                </div>

                {/* Avatar picker */}
                <div style={{ color: "#aaa", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>CHOOSE AVATAR</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
                  {CHARS.map(c => (
                    <div
                      key={c.id}
                      className="picker-char"
                      onClick={() => setEditAvatar(c.id)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}
                    >
                      <div style={{
                        width: 72, height: 72, borderRadius: 14,
                        background: c.color + "18",
                        border: `2.5px solid ${editAvatar === c.id ? c.color : "transparent"}`,
                        position: "relative", overflow: "hidden",
                        boxShadow: editAvatar === c.id ? `0 0 0 3px ${c.color}44` : "none",
                        transition: "box-shadow .15s, border-color .15s",
                      }}>
                        <Image src={`/agents/${c.file}`} alt={c.name} fill style={{ objectFit: "contain", padding: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: editAvatar === c.id ? c.color : "#aaa" }}>{c.name}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setProfile(false)} style={{
                    flex: 1, padding: "12px 0", borderRadius: 30,
                    background: "#f5f5f5", border: "1px solid #e8e8e8",
                    cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#777",
                  }}>Cancel</button>
                  <button onClick={saveProfile} style={{
                    flex: 2, padding: "12px 0", borderRadius: 30,
                    background: "linear-gradient(90deg,#ff8a3d,#ff5e7a)",
                    border: "none", cursor: "pointer",
                    color: "#fff", fontWeight: 800, fontSize: 14,
                  }}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

/* ── Character node ── */
function CharNode({ char, hovered, onEnter, onLeave, onClick }) {
  const w = char.isMain ? char.imgH * 0.92 : char.imgH * 0.80;
  return (
    <div
      className="char-node"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        marginLeft: char.isMain ? -110 : -88,
        transform: hovered ? "translateY(-18px)" : "none",
        zIndex: hovered ? 10 : (char.isMain ? 5 : 1),
        position: "relative",
      }}
    >
      {/* Hover tooltip */}
      <div style={{
        position: "absolute", top: -52, left: "50%", transform: "translateX(-50%)",
        background: INK, color: "#fff",
        borderRadius: 30, padding: "5px 14px",
        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
        opacity: hovered ? 1 : 0,
        transition: "opacity .18s",
        pointerEvents: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,.15)",
      }}>
        {char.name}
        {!char.noLevel && <span style={{ color: char.color, marginLeft: 6 }}>Lv.{char.level}</span>}
        <span style={{ color: "#aaa", marginLeft: 6, fontSize: 10 }}>click for info</span>
        <div style={{
          position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `5px solid ${INK}`,
        }} />
      </div>

      {/* Character image */}
      <div style={{ position: "relative", width: w, height: char.imgH }}>
        <Image
          src={`/agents/${char.file}`}
          alt={char.name}
          fill
          style={{
            objectFit: "contain",
            filter: `drop-shadow(0 ${char.isMain ? 18 : 10}px ${char.isMain ? 28 : 14}px rgba(0,0,0,.14))`,
          }}
          priority={char.isMain}
        />
      </div>
    </div>
  );
}

/* ── Donut stat (nav bar) ── */
function DonutStat({ stat }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const arc  = (stat.pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <svg width="52" height="52" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke={stat.color + "22"} strokeWidth="4.5" />
        <circle
          cx="20" cy="20" r={r} fill="none"
          stroke={stat.color} strokeWidth="4.5"
          strokeDasharray={`${arc} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
        <text x="20" y="20" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 9, fontWeight: 800, fill: stat.color, fontFamily: "inherit" }}>
          {stat.short}
        </text>
      </svg>
      <span style={{ fontSize: 9, fontWeight: 700, color: stat.color + "bb", letterSpacing: .5 }}>
        {stat.label.toUpperCase()}
      </span>
    </div>
  );
}

/* ── Friend row ── */
function FriendRow({ friend, offline }) {
  return (
    <div className="friend-row" style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "8px 20px", cursor: "pointer",
      transition: "background .15s",
      opacity: offline ? 0.5 : 1,
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: friend.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>{friend.emoji}</div>
        {!offline && (
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 11, height: 11, borderRadius: "50%",
            background: "#22c55e", border: "2px solid #fafafa",
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: INK, fontWeight: 700, fontSize: 13 }}>{friend.name}</div>
        <div style={{ color: "#bbb", fontSize: 11 }}>{friend.mood}</div>
      </div>
    </div>
  );
}
