"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const INK = "#1a1a2e";
const GROUP = "__group__";

/* Visual metadata for known Emochi characters (matched by agent name). */
const CHAR_META = {
  wisey:  { color: "#C9A857", file: "wisey.png",  role: "Wisdom & Balance" },
  dozy:   { color: "#6C7A96", file: "dozy.png",   role: "Rest & Recovery" },
  zen:    { color: "#5FD4C4", file: "zen.png",    role: "Peace & Mindfulness" },
  buzzy:  { color: "#FF6B4A", file: "buzzy.png",  role: "Anger & Drive" },
  fear:   { color: "#A78BFA", file: "fear.png",   role: "Caution & Awareness" },
  cheer:  { color: "#FFC53D", file: "cheer.png",  role: "Joy & Enthusiasm" },
  tear:   { color: "#4A90D9", file: "tear.png",   role: "Sadness & Empathy" },
  bubble: { color: "#F97316", file: "bubble.png", role: "Excitement & Creativity" },
};

function metaFor(name) {
  return (
    CHAR_META[name?.toLowerCase()] ?? { color: "#999", file: null, role: "Foundry Agent" }
  );
}

function Avatar({ name, size = 44, ring = true }) {
  const meta = metaFor(name);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: meta.color + "22",
        border: ring ? `2px solid ${meta.color}` : "none",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {meta.file ? (
        <Image src={`/idle/${meta.file}`} alt={name} fill style={{ objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.45 }}>💬</span>
      )}
    </div>
  );
}

/* Overlapping avatar stack for the group row/header. */
function AvatarStack({ names, size = 34, max = 5 }) {
  const shown = names.slice(0, max);
  return (
    <div style={{ display: "flex", flexShrink: 0 }}>
      {shown.map((n, i) => (
        <div key={n} style={{ marginLeft: i === 0 ? 0 : -size * 0.35, zIndex: shown.length - i }}>
          <Avatar name={n} size={size} />
        </div>
      ))}
      {names.length > max && (
        <div style={{
          width: size, height: size, borderRadius: "50%", marginLeft: -size * 0.35,
          background: "#eee", border: "2px solid #ddd", zIndex: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.34, fontWeight: 800, color: "#888", flexShrink: 0,
        }}>+{names.length - max}</div>
      )}
    </div>
  );
}

function ChatInner() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("agent");

  const [agents, setAgents] = useState(null);   // null = loading
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null); // agent name or GROUP
  // Thread state per key (agent name or GROUP):
  // { messages: [{role, text, agent?}], lastResponseId? }
  const [threads, setThreads] = useState({});
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(new Set()); // agent names still replying
  const [debating, setDebating] = useState(false);   // group debate stream in flight
  const bottomRef = useRef(null);

  const sending = debating || pending.size > 0;

  useEffect(() => {
    fetch("/api/agents")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
        setAgents(data.agents);
        if (data.agents.length > 0) {
          const match = requested
            ? data.agents.find(
                (a) => a.name.toLowerCase() === requested.toLowerCase()
              )
            : null;
          setSelected(match ? match.name : GROUP);
        }
      })
      .catch((e) => setLoadError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isGroup = selected === GROUP;
  const thread = threads[selected] ?? { messages: [], lastResponseId: null };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages.length, pending.size]);

  function appendMessage(key, msg) {
    setThreads((t) => ({
      ...t,
      [key]: {
        ...(t[key] ?? { lastResponseId: null }),
        messages: [...(t[key]?.messages ?? []), msg],
      },
    }));
  }

  async function askAgent(agentName, message, previousResponseId) {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: agentName, message, previousResponseId }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
    return data;
  }

  async function sendSingle(text) {
    const agent = selected;
    const prev = threads[agent]?.lastResponseId ?? null;
    appendMessage(agent, { role: "user", text });
    setPending(new Set([agent]));
    try {
      const data = await askAgent(agent, text, prev);
      setThreads((t) => ({
        ...t,
        [agent]: {
          messages: [
            ...(t[agent]?.messages ?? []),
            { role: "agent", agent, text: data.reply },
          ],
          lastResponseId: data.responseId,
        },
      }));
    } catch (e) {
      appendMessage(agent, { role: "error", agent, text: e.message });
    } finally {
      setPending(new Set());
    }
  }

  // The backend directs the debate: who participates, who speaks when,
  // when it ends, and Wisey always judges last. We just render the stream.
  async function sendGroup(text) {
    const history = (threads[GROUP]?.messages ?? [])
      .filter((m) => m.role !== "error")
      .map((m) => ({
        speaker: m.role === "user" ? "User" : m.agent,
        text: m.text,
      }));
    appendMessage(GROUP, { role: "user", text });
    setDebating(true);

    try {
      const r = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      if (!r.ok || !r.body) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${r.status}`);
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let ev;
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          if (ev.type === "turn_start") {
            setPending(new Set([ev.agent]));
          } else if (ev.type === "turn") {
            setPending(new Set());
            appendMessage(GROUP, { role: "agent", agent: ev.agent, text: ev.text });
          } else if (ev.type === "error") {
            setPending(new Set());
            appendMessage(GROUP, { role: "error", text: ev.message });
          }
        }
      }
    } catch (e) {
      appendMessage(GROUP, { role: "error", text: e.message });
    } finally {
      setPending(new Set());
      setDebating(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text || sending || !selected) return;
    setInput("");
    if (isGroup) sendGroup(text);
    else sendSingle(text);
  }

  const meta = isGroup
    ? { color: "#C9A857", role: "Everyone weighs in" }
    : metaFor(selected);
  const agentNames = agents?.map((a) => a.name) ?? [];

  return (
    <>
      <style>{`
        .agent-row:hover { background: #f3f3f3; }
        .chat-send:hover { filter: brightness(1.06); }
        @keyframes bounceDot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        .dot { width:7px; height:7px; border-radius:50%; background:#bbb; display:inline-block; animation:bounceDot 1.2s infinite; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0,
        background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
        fontFamily: "var(--font-baloo),'Baloo 2',sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        {/* ── Top bar ── */}
        <div style={{
          height: 72, display: "flex", alignItems: "center", gap: 16,
          padding: "0 28px", borderBottom: "1px solid #f0f0f0",
          background: "rgba(255,253,240,.92)", backdropFilter: "blur(8px)",
        }}>
          <Link href="/home" style={{
            display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
            padding: "8px 16px", borderRadius: 30, background: "#f5f5f5",
            border: "1px solid #e8e8e8", color: "#555", fontWeight: 700, fontSize: 13,
          }}>← Home</Link>
          <div style={{ fontSize: 24, fontWeight: 800, color: INK }}>
            <span style={{ color: "#ffb703" }}>Emo</span>chi
            <span style={{ color: "#bbb", fontWeight: 700, fontSize: 15, marginLeft: 10 }}>
              Talk to your feelings
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* ── Agent sidebar ── */}
          <div style={{
            width: 250, borderRight: "1px solid #f0f0f0", background: "#fafafa",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "16px 20px 8px", color: "#bbb", fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>
              YOUR MOODLINGS
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {agents === null && !loadError && (
                <div style={{ padding: 20, color: "#bbb", fontSize: 13 }}>Loading agents…</div>
              )}
              {loadError && (
                <div style={{ padding: 20, color: "#d33", fontSize: 12.5, lineHeight: 1.5 }}>
                  Couldn&apos;t reach Foundry: {loadError}
                </div>
              )}

              {agents?.length > 0 && (
                <div className="agent-row" onClick={() => setSelected(GROUP)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", cursor: "pointer",
                    background: isGroup ? "#fff" : "transparent",
                    borderLeft: `3px solid ${isGroup ? "#C9A857" : "transparent"}`,
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background .15s",
                  }}>
                  <AvatarStack names={agentNames} size={30} max={4} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: INK, fontWeight: 800, fontSize: 14 }}>Everyone</div>
                    <div style={{ color: "#bbb", fontSize: 11 }}>Group chat · {agentNames.length} Moodlings</div>
                  </div>
                </div>
              )}

              {agents?.map((a) => {
                const m = metaFor(a.name);
                const active = a.name === selected;
                return (
                  <div key={a.id} className="agent-row" onClick={() => setSelected(a.name)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "9px 20px", cursor: "pointer",
                      background: active ? "#fff" : "transparent",
                      borderLeft: `3px solid ${active ? m.color : "transparent"}`,
                      transition: "background .15s",
                    }}>
                    <Avatar name={a.name} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: INK, fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                      <div style={{
                        color: "#bbb", fontSize: 11, whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis",
                      }}>{a.description ?? m.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Chat area ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {selected ? (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 28px", borderBottom: "1px solid #f0f0f0", background: "#fffdf5",
                }}>
                  {isGroup
                    ? <AvatarStack names={agentNames} size={44} max={8} />
                    : <Avatar name={selected} size={48} />}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: INK }}>
                      {isGroup ? "The Moodling Council" : selected}
                    </div>
                    <div style={{
                      display: "inline-flex", padding: "2px 10px", borderRadius: 20,
                      background: meta.color, color: "#fff", fontSize: 10.5, fontWeight: 700,
                    }}>✦ {meta.role}</div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
                  {thread.messages.length === 0 && (
                    <div style={{ textAlign: "center", marginTop: 60, color: "#ccc" }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                        {isGroup
                          ? <AvatarStack names={agentNames} size={64} max={8} />
                          : <Avatar name={selected} size={90} />}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {isGroup
                          ? "Ask the whole crew — everyone will weigh in 🎭"
                          : `Say hi to ${selected} 👋`}
                      </div>
                    </div>
                  )}
                  {thread.messages.map((m, i) => {
                    const who = m.agent ?? selected;
                    const whoMeta = metaFor(who);
                    return (
                      <div key={i} style={{
                        display: "flex", gap: 10, marginBottom: 14,
                        flexDirection: m.role === "user" ? "row-reverse" : "row",
                        alignItems: "flex-end",
                      }}>
                        {m.role !== "user" && <Avatar name={who} size={32} />}
                        <div style={{ maxWidth: "62%" }}>
                          {m.role === "agent" && isGroup && (
                            <div style={{
                              fontSize: 11, fontWeight: 800, color: whoMeta.color,
                              margin: "0 0 3px 6px",
                            }}>{who}</div>
                          )}
                          <div style={{
                            padding: "11px 16px", fontSize: 14.5, lineHeight: 1.55,
                            whiteSpace: "pre-wrap", overflowWrap: "break-word",
                            borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: m.role === "user" ? INK
                              : m.role === "error" ? "#fdecec" : "#fff",
                            color: m.role === "user" ? "#fff"
                              : m.role === "error" ? "#c0392b" : INK,
                            border: m.role === "agent" ? `1.5px solid ${whoMeta.color}44` : "none",
                            boxShadow: "0 2px 10px rgba(0,0,0,.05)",
                            fontWeight: 600,
                          }}>
                            {m.role === "error" ? `⚠️ ${m.text}` : m.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {[...pending].map((name) => (
                    <div key={name} style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 10 }}>
                      <Avatar name={name} size={32} />
                      <div style={{
                        padding: "14px 18px", borderRadius: "18px 18px 18px 4px",
                        background: "#fff", border: `1.5px solid ${metaFor(name).color}44`,
                        display: "flex", gap: 5,
                      }}>
                        <span className="dot" />
                        <span className="dot" style={{ animationDelay: ".15s" }} />
                        <span className="dot" style={{ animationDelay: ".3s" }} />
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div style={{ padding: "16px 28px 22px", borderTop: "1px solid #f0f0f0", background: "#fffdf5" }}>
                  <div style={{
                    display: "flex", gap: 10, alignItems: "center",
                    background: "#fff", borderRadius: 30, padding: "6px 6px 6px 20px",
                    border: "1.5px solid #ececec", boxShadow: "0 4px 16px rgba(0,0,0,.04)",
                  }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder={isGroup ? "Message everyone…" : `Message ${selected}…`}
                      disabled={sending}
                      style={{
                        flex: 1, border: "none", outline: "none", fontSize: 15,
                        fontFamily: "inherit", fontWeight: 600, color: INK, background: "transparent",
                      }}
                    />
                    <button className="chat-send" onClick={send} disabled={sending || !input.trim()}
                      style={{
                        padding: "11px 26px", borderRadius: 30, border: "none",
                        background: sending || !input.trim()
                          ? "#e5e5e5"
                          : `linear-gradient(90deg,${meta.color},${meta.color}cc)`,
                        color: "#fff", fontWeight: 800, fontSize: 14,
                        cursor: sending || !input.trim() ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}>Send</button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                color: "#ccc", fontWeight: 700, fontSize: 16, padding: 40, textAlign: "center",
              }}>
                {loadError
                  ? "Fix the Foundry connection to start chatting."
                  : agents?.length === 0
                    ? "No agents found in your Foundry project."
                    : "Pick a Moodling to start chatting."}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatInner />
    </Suspense>
  );
}
