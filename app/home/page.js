"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const INK = "#1a1a2e";

const CHARS = [
  {
    id: "cheer", name: "Cheer", color: "#FFC53D", file: "Cheer.png", isMain: false, imgH: 270, level: 4,
    role: "Joy & Enthusiasm",
    intro: "Hey! I'm Cheer — your inner cheerleader! I find the bright side in every situation and keep your energy up when things feel heavy. Every win, no matter how small, deserves to be celebrated. When you're ready to give up, I'm the voice that says keep going. You've got this, and I'll be right here!",
    traits: ["Boosts motivation", "Celebrates every win", "Spreads positive energy", "Keeps you moving forward"],
  },
  {
    id: "fear", name: "Fear", color: "#A78BFA", file: "Fear.png", isMain: false, imgH: 270, level: 3,
    role: "Caution & Awareness",
    intro: "I'm Fear. I know that sounds scary — but hear me out. I'm actually your early-warning system. I notice danger before it reaches you, keep you sharp, and make sure you never walk into something unprepared. Without me, you'd take risks you'd regret. I'm not here to stop you — I'm here to protect you.",
    traits: ["Risk detection", "Protective instincts", "Heightens awareness", "Prepares for the unexpected"],
  },
  {
    id: "buzzy", name: "Buzzy", color: "#FF6B4A", file: "Buzzy.png", isMain: false, imgH: 270, level: 5,
    role: "Anger & Drive",
    intro: "Name's Buzzy. I take all that frustration you feel and turn it into fuel. When something's unfair, I don't stay quiet — I set limits, push back, and get things done. A lot of people fear me, but without drive and fire, nothing ever changes. Channel me right and we'll move mountains.",
    traits: ["Sets clear limits", "Turns frustration into action", "Fights for what's right", "Raw, unstoppable energy"],
  },
  {
    id: "tear", name: "Tear", color: "#4A90D9", file: "Tear.png", isMain: false, imgH: 270, level: 3,
    role: "Sadness & Empathy",
    intro: "I'm Tear. I help you feel what needs to be felt — grief, loss, longing. I don't make you sad. I make sure sadness doesn't stay trapped inside you. When you let me flow, you heal. I also make you deeply human — able to feel what others carry. That empathy? That's one of your greatest strengths.",
    traits: ["Deep emotional processing", "Compassion for others", "Slows down to reflect", "Healing through feeling"],
  },
  {
    id: "wisey", name: "Wisey", color: "#C9A857", file: "Wisey.png", isMain: true, imgH: 360, level: 8, noLevel: true,
    role: "Wisdom & Balance",
    intro: "I'm Wisey. I hold this whole crew together. When the others argue, I listen to every side before I speak. I've witnessed what happens when emotions go unchecked — and I know what balance truly looks like. I'm not the loudest voice in here, but I'm the one you reach for when it really matters.",
    traits: ["Calm under pressure", "Sees the bigger picture", "Mediates conflicts", "Leads with reason and heart"],
  },
  {
    id: "zen", name: "Zen", color: "#5FD4C4", file: "Zen.png", isMain: false, imgH: 270, level: 6,
    role: "Peace & Mindfulness",
    intro: "Hey... breathe. I'm Zen. When everything around you is chaos, I'm the stillness inside. I guide you back to your breath, back to right now. The past is gone. The future isn't here yet. This moment — right here — is where I live. Let me show you how to find calm no matter what storm you're in.",
    traits: ["Grounds racing thoughts", "Slows the spiral", "Finds calm in chaos", "Present-moment awareness"],
  },
  {
    id: "bubble", name: "Bubble", color: "#F97316", file: "Bubble.png", isMain: false, imgH: 270, level: 4,
    role: "Excitement & Creativity",
    intro: "Oh hi hi hi! I'm Bubble and I am SO excited to meet you! I see magic in everything — ordinary moments turn into adventures when I'm around. I'm the spark behind your wildest ideas and the reason you keep asking 'what if?' Life is too short to be boring, so let's make it an adventure!",
    traits: ["Endless curiosity", "Creative problem-solving", "Contagious excitement", "Sees magic in the mundane"],
  },
  {
    id: "dozy", name: "Dozy", color: "#6C7A96", file: "Dozy.png", isMain: false, imgH: 270, level: 2,
    role: "Rest & Recovery",
    intro: "Psst... hey. I'm Dozy. I know everyone ignores me until it's too late. But rest isn't laziness — it's how you repair. Your body and mind need to stop sometimes. You can't pour from an empty cup. I signal exhaustion early so you don't burn out completely. Listen to me before the crash, not after.",
    traits: ["Prioritizes recovery", "Signals exhaustion early", "Slows the pace", "Protects your energy"],
  },
];

const AVATAR_OPTIONS = [
  ...CHARS.map(c => ({ key: c.id, name: c.name, color: c.color, src: `/idle/${c.file.toLowerCase()}`, variant: "Classic" })),
  ...CHARS.filter(c => c.id !== "wisey").map(c => ({ key: `${c.id}-winner`, name: c.name, color: c.color, src: `/winner/${c.id}-winner.png`, variant: "Winner" })),
];

function getAvatarSrc(key) {
  const opt = AVATAR_OPTIONS.find(o => o.key === key);
  return opt ? opt.src : "/idle/wisey.png";
}

const EMPTY_STATS = [
  { icon: "🌙", label: "Sleep", short: "—", pct: 0, color: "#8b5cf6" },
  { icon: "💼", label: "Work",  short: "—", pct: 0, color: "#f59e0b" },
  { icon: "😊", label: "Mood",  short: "—", pct: 0, color: "#22c55e" },
];

const FRIENDS = [
  { id: 1, name: "Pailin", emoji: "🐱", bg: "#6bd6c9", online: true,  mood: "😄 Great"  },
  { id: 2, name: "Min",    emoji: "🐰", bg: "#ffb15e", online: true,  mood: "😌 Calm"   },
  { id: 3, name: "Hein",   emoji: "🐶", bg: "#5ec8f7", online: true,  mood: "😴 Tired"  },
  { id: 4, name: "Sofia",  emoji: "🦊", bg: "#A78BFA", online: false, mood: "😢 Sad"    },
  { id: 5, name: "James",  emoji: "🐸", bg: "#5FD4C4", online: false, mood: "😐 Meh"    },
];

// ── Daily check-in scoring tables ─────────────────────────────
// Agent name keys map to CHARS ids: Cheer, Fear, Buzzy, Tear, Zen, Bubble, Dozy

const FEELINGS = [
  { name: "Happy",   emoji: "😊", deltas: { Cheer: 3, Tear: -3 } },
  { name: "Excited", emoji: "⚡", deltas: { Cheer: 3, Dozy: -2 } },
  { name: "Hopeful", emoji: "🌟", deltas: { Cheer: 3, Zen: 2, Fear: -2 } },
  { name: "Calm",    emoji: "😌", deltas: { Zen: 3, Buzzy: -3 } },
  { name: "Stressed",emoji: "😤", deltas: { Buzzy: 3, Zen: -3 } },
  { name: "Anxious", emoji: "😰", deltas: { Fear: 3, Buzzy: 2, Zen: -2 } },
  { name: "Worried", emoji: "😟", deltas: { Fear: 3, Cheer: -2 } },
  { name: "Sad",     emoji: "😢", deltas: { Tear: 3, Cheer: -3 } },
  { name: "Tired",   emoji: "😴", deltas: { Dozy: 3, Cheer: -2 } },
  { name: "Lonely",  emoji: "🥺", deltas: { Tear: 2, Bubble: 3, Cheer: -2 } },
];

const SLEEP_OPTIONS = [
  { label: "Less than 5 hrs", sub: "Poor sleep",    short: "<5h",  pct: 28, deltas: { Dozy: 3, Buzzy: 2, Zen: -2 } },
  { label: "5–6 hrs",         sub: "Below average", short: "5-6h", pct: 58, deltas: { Dozy: 2 } },
  { label: "7–9 hrs",         sub: "Healthy range", short: "7-9h", pct: 92, deltas: { Zen: 3, Cheer: 2, Buzzy: -2 } },
  { label: "More than 9 hrs", sub: "Oversleep",     short: ">9h",  pct: 68, deltas: { Dozy: 2 } },
];

const WORK_OPTIONS = [
  { label: "0–3 hrs",          sub: "Light day",  short: "0-3h",  pct: 22,  deltas: { Dozy: 2, Buzzy: -2 } },
  { label: "4–7 hrs",          sub: "Balanced",   short: "4-7h",  pct: 55,  deltas: {} },
  { label: "8–10 hrs",         sub: "Heavy day",  short: "8-10h", pct: 82,  deltas: { Buzzy: 3, Zen: -2 } },
  { label: "More than 10 hrs", sub: "Overloaded", short: ">10h",  pct: 100, deltas: { Buzzy: 3, Dozy: 2, Cheer: -2 } },
];

// Reverse-map stored decimal hours back to option indices
const SLEEP_HOURS_LOOKUP = (h) => h == null ? null : h <= 4 ? 0 : h <= 6 ? 1 : h <= 9 ? 2 : 3;
const WORK_HOURS_LOOKUP  = (h) => h == null ? null : h <= 3 ? 0 : h <= 7 ? 1 : h <= 10 ? 2 : 3;

// mood score per feeling (for the Mood donut)
const FEELING_MOOD = {
  Happy:   { emoji: "😊", pct: 90 },
  Excited: { emoji: "😄", pct: 85 },
  Hopeful: { emoji: "🌟", pct: 80 },
  Calm:    { emoji: "😌", pct: 75 },
  Stressed:{ emoji: "😤", pct: 38 },
  Anxious: { emoji: "😰", pct: 32 },
  Worried: { emoji: "😟", pct: 28 },
  Sad:     { emoji: "😢", pct: 22 },
  Tired:   { emoji: "😴", pct: 45 },
  Lonely:  { emoji: "🥺", pct: 33 },
};

function getMoodStat(feelingIdxs) {
  if (!feelingIdxs.length) return { emoji: "😐", pct: 50 };
  const moods = feelingIdxs.map(i => FEELING_MOOD[FEELINGS[i].name]);
  const pct = Math.round(moods.reduce((s, m) => s + m.pct, 0) / moods.length);
  return { emoji: moods[0].emoji, pct };
}

const CHAR_COLOR = {
  Cheer: "#FFC53D", Fear: "#A78BFA", Buzzy: "#FF6B4A",
  Tear: "#4A90D9", Zen: "#5FD4C4", Bubble: "#F97316", Dozy: "#6C7A96",
};

function getWiseySuggestions(stats) {
  const sleep = stats.find(s => s.label === "Sleep");
  const work  = stats.find(s => s.label === "Work");
  const mood  = stats.find(s => s.label === "Mood");
  if (!sleep || sleep.pct === 0) {
    return [
      "Start your day right — complete your daily check-in!",
      "I'm here whenever you're ready to reflect on your day.",
      "Check in to unlock personalized insights just for you.",
    ];
  }
  const tips = [];
  if (sleep.pct < 60)  tips.push("You didn't sleep enough. Try to rest a bit earlier tonight.");
  if (sleep.pct >= 85) tips.push("Great sleep! Your mind is sharp — tackle something important today.");
  if (work.pct >= 80)  tips.push("Heavy work day. Remember to take a break every 90 minutes.");
  if (work.pct < 30)   tips.push("Light schedule today — a great chance to recharge or do something creative.");
  if (mood.pct < 40)   tips.push("Your mood seems low. A short walk or kind conversation can help.");
  if (mood.pct >= 80)  tips.push("You're in great spirits! Share that energy with someone who needs it.");
  if (mood.pct >= 50 && mood.pct < 80) tips.push("Steady day ahead. Stay grounded and focus on what matters most.");
  if (tips.length === 0) tips.push("Balance is your strength today. Keep that rhythm going.");
  return tips;
}

function localDateStr(d) {
  // Use local year/month/day (not UTC) so timezone offsets don't shift the date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCheckinDate() {
  const now = new Date();
  if (now.getHours() < 6) now.setDate(now.getDate() - 1);
  return localDateStr(now);
}

function getRecentDates() {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    const label = i === 0 ? "Today" : i === 1 ? "Yesterday"
      : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    dates.push({ key, label });
  }
  return dates;
}

function getHistoryScores(dateKey) {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem(`emochi_checkin_${dateKey}`);
    if (!raw) return null;
    const { feelingIdxs, sleepIdx, workIdx } = JSON.parse(raw);
    const deltas = calcDeltas(feelingIdxs ?? [], sleepIdx ?? null, workIdx ?? null);
    return CHARS
      .filter(c => !c.noLevel)
      .map(c => ({ ...c, score: c.level + (deltas[c.name] ?? 0) }))
      .sort((a, b) => b.score - a.score);
  } catch { return null; }
}

function calcDeltas(selectedFeelings, sleepIdx, workIdx) {
  const total = {};
  const apply = (d) => Object.entries(d).forEach(([k, v]) => { total[k] = (total[k] || 0) + v; });
  selectedFeelings.forEach((i) => apply(FEELINGS[i].deltas));
  if (sleepIdx !== null) apply(SLEEP_OPTIONS[sleepIdx].deltas);
  if (workIdx  !== null) apply(WORK_OPTIONS[workIdx].deltas);
  return total;
}

// ── Main page ─────────────────────────────────────────────────

export default function MainPage() {
  const router = useRouter();
  const [scale, setScale]           = useState(1);
  const [friendsOpen, setFriends]   = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef(null);
  const [historyOpen, setHistory]   = useState(false);
  const [historyDate, setHistoryDate] = useState(getCheckinDate);
  const [historyScores, setHistoryScores] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hovChar, setHovChar]       = useState(null);
  const [charPopup, setCharPopup]   = useState(null);
  const [profileOpen, setProfile]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [avatar, setAvatar]         = useState("wisey");
  const [userName, setUserName]     = useState("You");
  const [userUsername, setUserUsername] = useState("");
  const [editName, setEditName]     = useState("You");
  const [editAvatar, setEditAvatar] = useState("wisey");
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [emochiScores, setEmochiScores] = useState({});
  const [profileMbti, setProfileMbti] = useState(null);
  const [profileInterests, setProfileInterests] = useState([]);
  const [allInterests, setAllInterests] = useState([]);
  const [editInterests, setEditInterests] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Friends feature state
  const [friendsList, setFriendsList]         = useState([]);
  const [friendRequests, setFriendRequests]   = useState([]);
  const [friendsTab, setFriendsTab]           = useState("friends"); // "friends" | "requests" | "search"
  const [sendingReq, setSendingReq]           = useState({}); // { [userId]: 'pending'|'friends'|'sent' }
  const [friendScores, setFriendScores]       = useState(null); // { friend, scores }
  const [friendScoresLoading, setFriendScoresLoading] = useState(false);

  // Daily check-in state
  const [stats, setStats]                       = useState(EMPTY_STATS);
  const [checkinOpen, setCheckinOpen]           = useState(false);
  const [checkinStep, setCheckinStep]           = useState(1);
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const [selectedSleep, setSelectedSleep]       = useState(null);
  const [selectedWork, setSelectedWork]         = useState(null);
  const [checkinDone, setCheckinDone]           = useState(false);
  const [cloudTab, setCloudTab]                 = useState(0); // 0=Mood 1=Sleep 2=Work
  const [wiseyTips, setWiseyTips]               = useState(null); // array of suggestions or null
  const [wiseyIdx, setWiseyIdx]                 = useState(0);
  const [wiseyLoading, setWiseyLoading]         = useState(false);

  useEffect(() => {
    const upd = () =>
      setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  useEffect(() => {
    fetch("/api/user")
      .then(r => r.json())
      .then(data => {
        if (data.displayName) setUserName(data.displayName);
        if (data.avatar) setAvatar(data.avatar);
      })
      .catch(() => {});
    fetch("/api/emochi-scores")
      .then(r => r.json())
      .then(data => { if (data && !data.error) setEmochiScores(data); })
      .catch(() => {});
    fetch("/api/friends")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFriendsList(data); })
      .catch(() => {});
    fetch("/api/friends/requests")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFriendRequests(data); })
      .catch(() => {});
  }, []);

  // Auto-cycle the cloud stat widget every 4 seconds
  useEffect(() => {
    const id = setInterval(() => setCloudTab(t => (t + 1) % 3), 4000);
    return () => clearInterval(id);
  }, []);

hy  // Auto-cycle through Wisey's suggestions (when there's more than one) every 5 seconds
  useEffect(() => {
    if (!wiseyTips || wiseyTips.length <= 1) return;
    const id = setInterval(() => setWiseyIdx(i => (i + 1) % wiseyTips.length), 5000);
    return () => clearInterval(id);
  }, [wiseyTips]);
  // Fetch history scores from DB whenever the panel opens or date changes
  useEffect(() => {
    if (!historyOpen) return;
    setHistoryScores(null);
    setHistoryLoading(true);
    fetch(`/api/history-scores?date=${historyDate}`)
      .then(r => r.json())
      .then(rows => {
        console.log("[history] date:", historyDate, "rows:", rows);
        if (!Array.isArray(rows)) {
          setHistoryScores([]);
          return;
        }
        if (rows.length === 0) {
          setHistoryScores([]);
          return;
        }
        const ranked = rows
          .map(row => {
            const char = CHARS.find(c => c.name.toLowerCase() === row.emochi_name.toLowerCase());
            console.log("[history] row:", row.emochi_name, "→ char:", char?.name);
            if (!char) return null;
            return { ...char, score: row.score, level: Math.min(10, Math.floor(row.score / 10)) };
          })
          .filter(Boolean)
          .sort((a, b) => b.score - a.score);
        console.log("[history] ranked:", ranked.length, "items");
        setHistoryScores(ranked);
      })
      .catch((e) => { console.error("[history] fetch error:", e); setHistoryScores([]); })
      .finally(() => setHistoryLoading(false));
  }, [historyOpen, historyDate]);

  // Show check-in popup once per day (resets at 6am); restore stats if already done
  useEffect(() => {
    const date = getCheckinDate();
    const key  = `emochi_checkin_${date}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const { sleepIdx, workIdx, feelingIdxs } = JSON.parse(saved);
        applyStats(feelingIdxs, sleepIdx, workIdx);
      } catch { setTimeout(() => setCheckinOpen(true), 600); }
    } else {
      // Try restoring from DB (e.g. new device / cleared storage)
      fetch(`/api/daily-checkin?date=${date}`)
        .then(r => r.json())
        .then(data => {
          if (data?.feelings != null) {
            // feelings stored as comma-separated indices
            const feelingIdxs = data.feelings.split(",").map(Number).filter(n => !isNaN(n));
            const sleepIdx = SLEEP_HOURS_LOOKUP(data.sleep_hours);
            const workIdx  = WORK_HOURS_LOOKUP(data.work_hours);
            localStorage.setItem(key, JSON.stringify({ feelingIdxs, sleepIdx, workIdx }));
            applyStats(feelingIdxs, sleepIdx, workIdx);
          } else {
            setTimeout(() => setCheckinOpen(true), 600);
          }
        })
        .catch(() => setTimeout(() => setCheckinOpen(true), 600));
    }
  }, []);

  // Merge DB scores into CHARS so levels reflect real data
  const enrichedChars = CHARS.map(c => {
    const s = emochiScores[c.id];
    return s ? { ...c, score: s.score, level: s.level } : c;
  });

  const currentChar = enrichedChars.find(c => c.id === (avatar ?? "").replace(/-winner$/, "")) ?? enrichedChars[4];
  const PANEL_W = 248;

  async function sendFriendRequest(toUserId) {
    setSendingReq(prev => ({ ...prev, [toUserId]: "loading" }));
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Friend request failed:", res.status, err);
        setSendingReq(prev => ({ ...prev, [toUserId]: null }));
        return;
      }
      setSendingReq(prev => ({ ...prev, [toUserId]: "sent" }));
      setSearchResults(prev => prev.map(u =>
        u.id === toUserId ? { ...u, friend_status: "pending_sent" } : u
      ));
    } catch (e) {
      console.error("Friend request error:", e);
      setSendingReq(prev => ({ ...prev, [toUserId]: null }));
    }
  }

  async function respondToRequest(requestId, fromUserId, action) {
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Respond failed:", res.status, err);
        return;
      }
      setFriendRequests(prev => prev.filter(r => r.request_id !== requestId));
      if (action === "accept") {
        fetch("/api/friends")
          .then(r => r.json())
          .then(data => { if (Array.isArray(data)) setFriendsList(data); })
          .catch(() => {});
      }
    } catch (e) {
      console.error("Respond error:", e);
    }
  }

  async function loadFriendScores(friend) {
    setFriendScores({ friend, scores: null });
    setFriendScoresLoading(true);
    try {
      const res = await fetch(`/api/friends/${friend.id}/scores`);
      const scores = await res.json();
      setFriendScores({ friend, scores });
    } catch {
      setFriendScores({ friend, scores: {} });
    } finally {
      setFriendScoresLoading(false);
    }
  }

  function handleFriendSearch(val) {
    setFriendSearch(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(val.trim())}`)
        .then(r => r.json())
        .then(data => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 350);
  }

  function openProfile() {
    setEditName(userName);
    setEditAvatar(avatar);
    setConfirmDelete(false);
    setEditingName(false);
    setEditingProfile(false);
    setAvatarPickerOpen(false);
    setCardFlipped(false);
    setProfile(true);
    // Fetch full profile (mbti + interests)
    fetch("/api/user")
      .then(r => r.json())
      .then(data => {
        setProfileMbti(data.mbti ?? null);
        setProfileInterests(data.interests ?? []);
        setEditInterests(data.interests ?? []);
        if (data.username) setUserUsername(data.username);
      })
      .catch(() => {});
    // Fetch all available interests
    fetch("/api/interests")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllInterests(data.map(i => i.name)); })
      .catch(() => {});
  }

  async function deleteAccount() {
    await fetch("/api/user", { method: "DELETE" });
    signOut({ callbackUrl: "/" });
  }

  // Save avatar immediately when picked — no need to hit Save button
  async function saveAvatar(key) {
    setEditAvatar(key);
    setAvatarPickerOpen(false);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: userName, avatar: key }),
      });
      setAvatar(key);
    } catch {}
  }

  // Save display name inline from the front face
  async function saveDisplayName() {
    const name = editName.trim() || null;
    setEditingName(false);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, avatar }),
      });
      setUserName(name || "You");
    } catch {}
  }

  // Save interests only (avatar + name have their own save paths now)
  async function saveProfile() {
    setSavingProfile(true);
    try {
      await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: editInterests }),
      });
      setProfileInterests(editInterests);
      setEditingProfile(false);
    } finally {
      setSavingProfile(false);
    }
  }

  function toggleFeeling(idx) {
    setSelectedFeelings(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : prev.length < 2 ? [...prev, idx] : prev
    );
  }

  function applyStats(feelingIdxs, sleepIdx, workIdx) {
    const mood  = getMoodStat(feelingIdxs);
    const sleep = SLEEP_OPTIONS[sleepIdx] ?? { short: "—", pct: 0 };
    const work  = WORK_OPTIONS[workIdx]   ?? { short: "—", pct: 0 };
    setStats([
      { icon: "🌙", label: "Sleep", short: sleep.short, pct: sleep.pct, color: "#8b5cf6" },
      { icon: "💼", label: "Work",  short: work.short,  pct: work.pct,  color: "#f59e0b" },
      { icon: "😊", label: "Mood",  short: mood.emoji,  pct: mood.pct,  color: "#22c55e" },
    ]);
    if (sleep.pct > 0) fetchWiseyTip(feelingIdxs, sleepIdx, workIdx, sleep, work, mood);
  }

  // Ask the real Wisey Foundry agent for several personalized insights using
  // today's actual check-in data (sleep/work/mood + which emotions shifted).
  // Falls back to the canned tips silently if Foundry is unreachable.
  async function fetchWiseyTip(feelingIdxs, sleepIdx, workIdx, sleep, work, mood) {
    setWiseyLoading(true);
    try {
      const deltas = calcDeltas(feelingIdxs, sleepIdx, workIdx);
      const r = await fetch("/api/wisey-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, sleep, work, mood, deltas }),
      });
      const data = await r.json();
      if (r.ok && data.replies?.length > 0) {
        setWiseyTips(data.replies);
        setWiseyIdx(0);
      }
    } catch {
      // keep the canned fallback tip on any network/auth failure
    } finally {
      setWiseyLoading(false);
    }
  }

  function submitCheckin() {
    const date = getCheckinDate();
    const key = `emochi_checkin_${date}`;
    localStorage.setItem(key, JSON.stringify({
      feelingIdxs: selectedFeelings,
      sleepIdx: selectedSleep,
      workIdx: selectedWork,
    }));
    applyStats(selectedFeelings, selectedSleep, selectedWork);
    // Save to database (fire-and-forget)
    const moodScore = getMoodStat(selectedFeelings).pct;
    fetch("/api/daily-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        sleepIdx: selectedSleep,
        workIdx: selectedWork,
        feelingIdxs: selectedFeelings,
        moodScore,
      }),
    }).catch(() => {});
    setCheckinDone(true);
    setTimeout(() => {
      setCheckinOpen(false);
      setCheckinDone(false);
      setCheckinStep(1);
      setSelectedFeelings([]);
      setSelectedSleep(null);
      setSelectedWork(null);
    }, 2200);
  }

  const deltas = checkinDone ? calcDeltas(selectedFeelings, selectedSleep, selectedWork) : {};

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
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes slideUp    { from{transform:translateY(24px) scale(.97);opacity:0} to{transform:none;opacity:1} }
        @keyframes cloudFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes cloudPop   { 0%{transform:scale(.9);opacity:0} 100%{transform:scale(1);opacity:1} }
        .friends-panel { transition: transform .28s cubic-bezier(.4,0,.2,1), opacity .28s; }
        .btn-logout { transition: transform .2s, box-shadow .2s; }
        .btn-logout:hover { transform: translateY(-6px); box-shadow: 0 16px 32px rgba(240,90,58,.45) !important; }
        .feeling-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,.1) !important; }
        .feeling-chip { transition: transform .15s, box-shadow .15s, background .15s, border-color .15s; }
        .option-btn:hover { border-color: #C9A857 !important; }
        .option-btn { transition: border-color .15s, background .15s; }
        @keyframes pop { 0%{transform:scale(.95);opacity:0} 100%{transform:scale(1);opacity:1} }
        .checkin-done { animation: pop .3s cubic-bezier(.34,1.56,.64,1); }
        @keyframes wiseyFade { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:none} }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif",
      }}>
        <div style={{
          position: "relative", width: 1600, height: 900, flex: "none",
          transform: `scale(${scale})`, transformOrigin: "center center",
          overflow: "hidden", borderRadius: 20,
          background: "linear-gradient(160deg,#fffdf0 0%,#fff8d6 60%,#fffef5 100%)",
          boxShadow: "0 8px 40px rgba(0,0,0,.08)",
        }}>

          {/* ══ TOP NAV BAR ══ */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 72,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 36px", zIndex: 30,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
                <Image src="/idle/logo.png" alt="Emochi logo" fill style={{ objectFit: "contain" }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: .5, color: INK }}>
                <span style={{ color: "#ffb703" }}>Emo</span>chi
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="avatar-pill" onClick={openProfile} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 20px 7px 7px", borderRadius: 50,
                background: "rgba(255,255,255,.7)", border: "1.5px solid #ececec",
                cursor: "pointer", transition: "filter .15s", backdropFilter: "blur(8px)",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: currentChar.color + "22",
                  border: `2px solid ${currentChar.color}`,
                  position: "relative", overflow: "hidden", flexShrink: 0,
                  boxShadow: `0 2px 8px ${currentChar.color}44`,
                }}>
                  <Image src={getAvatarSrc(avatar)} alt={currentChar.name} fill style={{ objectFit: "cover" }} />
                </div>
                <span style={{ color: INK, fontWeight: 700, fontSize: 15 }}>{userName}</span>
              </button>
              <button onClick={() => setHistory(o => !o)} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 20px", borderRadius: 36,
                background: historyOpen ? "#6366f1" : "rgba(255,255,255,.7)",
                border: "1px solid #e8e8e8", backdropFilter: "blur(8px)",
                cursor: "pointer", transition: "background .2s",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: historyOpen ? "#fff" : "#555" }}>bar_chart</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: historyOpen ? "#fff" : "#555" }}>History</span>
              </button>
              <button onClick={() => { setFriends(o => !o); if (!friendsOpen) setFriendsTab("friends"); }} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 20px", borderRadius: 36,
                background: friendsOpen ? INK : "rgba(255,255,255,.7)",
                border: "1px solid #e8e8e8", backdropFilter: "blur(8px)",
                cursor: "pointer", transition: "background .2s", position: "relative",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: friendsOpen ? "#fff" : "#555" }}>group</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: friendsOpen ? "#fff" : "#555" }}>Friends</span>
                {friendRequests.length > 0 && (
                  <span style={{
                    position: "absolute", top: 6, right: 6,
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#ef4444", color: "#fff",
                    fontSize: 9, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{friendRequests.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* ══ FRIENDS PANEL ══ */}
          <div className="friends-panel" style={{
            position: "absolute", right: 0, top: 80, bottom: 0, width: PANEL_W,
            background: "#fafafa", borderLeft: "1px solid #f0f0f0",
            display: "flex", flexDirection: "column", zIndex: 50,
            transform: friendsOpen ? "translateX(0)" : `translateX(${PANEL_W}px)`,
            opacity: friendsOpen ? 1 : 0,
            pointerEvents: friendsOpen ? "auto" : "none",
            transition: "transform .25s ease, opacity .2s",
            boxShadow: "-8px 0 32px rgba(0,0,0,.10)",
          }}>
            {/* Header */}
            <div style={{ padding: "16px 16px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: INK }}>Friends</div>
                <button onClick={() => setFriends(false)} style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#f0f0f0", border: "none", cursor: "pointer", fontSize: 13, color: "#777",
                }}>✕</button>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                {[
                  { key: "friends", label: "Friends", icon: "group" },
                  { key: "requests", label: "Requests", icon: "person_add", badge: friendRequests.length },
                  { key: "search", label: "Search", icon: "person_search" },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setFriendsTab(tab.key)} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    padding: "6px 4px 8px", borderRadius: 10,
                    background: friendsTab === tab.key ? INK : "transparent",
                    border: "none", cursor: "pointer", position: "relative",
                    transition: "background .15s",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: friendsTab === tab.key ? "#fff" : "#888" }}>{tab.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: friendsTab === tab.key ? "#fff" : "#999", letterSpacing: .3 }}>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span style={{
                        position: "absolute", top: 3, right: 6,
                        width: 14, height: 14, borderRadius: "50%",
                        background: "#ef4444", color: "#fff",
                        fontSize: 8, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{tab.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Friends tab ── */}
            {friendsTab === "friends" && (
              <div style={{ overflowY: "auto", flex: 1 }}>
                {friendsList.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#ccc" }}>group</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", textAlign: "center" }}>No friends yet — search to add people!</div>
                  </div>
                ) : (
                  <div style={{ padding: "8px 0" }}>
                    {friendsList.map(f => (
                      <button key={f.id} onClick={() => loadFriendScores(f)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
                        textAlign: "left",
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", background: "#e8e8f0",
                          flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {f.avatar_emochi
                            ? <img src={`/idle/${f.avatar_emochi.toLowerCase()}.png`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#aaa" }}>person</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: INK, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.display_name || f.username}</div>
                          <div style={{ color: "#bbb", fontSize: 11 }}>@{f.username}</div>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#ccc" }}>chevron_right</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Requests tab ── */}
            {friendsTab === "requests" && (
              <div style={{ overflowY: "auto", flex: 1 }}>
                {friendRequests.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#ccc" }}>person_add</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", textAlign: "center" }}>No pending requests</div>
                  </div>
                ) : (
                  <div style={{ padding: "8px 0" }}>
                    {friendRequests.map(r => (
                      <div key={r.request_id} style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", background: "#e8e8f0",
                          flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {r.avatar_emochi
                            ? <img src={`/idle/${r.avatar_emochi.toLowerCase()}.png`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#aaa" }}>person</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: INK, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.display_name || r.username}</div>
                          <div style={{ color: "#bbb", fontSize: 10 }}>@{r.username}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            <button onClick={() => respondToRequest(r.request_id, r.id, "accept")} style={{
                              flex: 1, padding: "4px 0", borderRadius: 8, border: "none", cursor: "pointer",
                              background: "#22c55e", color: "#fff", fontWeight: 700, fontSize: 11,
                            }}>Accept</button>
                            <button onClick={() => respondToRequest(r.request_id, r.id, "decline")} style={{
                              flex: 1, padding: "4px 0", borderRadius: 8, border: "none", cursor: "pointer",
                              background: "#f0f0f0", color: "#888", fontWeight: 700, fontSize: 11,
                            }}>Decline</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Search tab ── */}
            {friendsTab === "search" && (
              <>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#bbb", pointerEvents: "none" }}>search</span>
                    <input
                      type="text"
                      placeholder="Search by name or username…"
                      value={friendSearch}
                      onChange={e => handleFriendSearch(e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "8px 12px 8px 34px",
                        borderRadius: 20, border: "1.5px solid #e8e8e8",
                        background: "#f5f5f5", fontSize: 12, color: INK,
                        outline: "none", fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {friendSearch.trim().length < 2 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#ccc" }}>person_search</span>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", textAlign: "center" }}>Type at least 2 characters to search</div>
                    </div>
                  ) : searchLoading ? (
                    <div style={{ padding: "16px 20px", color: "#bbb", fontSize: 13 }}>Searching…</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: "16px 20px", color: "#bbb", fontSize: 13 }}>No users found.</div>
                  ) : (
                    <div style={{ padding: "8px 0" }}>
                      {searchResults.map(u => {
                        const status = u.friend_status;
                        return (
                          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px" }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: "50%", background: "#e8e8f0",
                              flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {u.avatar_emochi
                                ? <img src={`/idle/${u.avatar_emochi.toLowerCase()}.png`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#aaa" }}>person</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: INK, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.display_name || u.username}</div>
                              <div style={{ color: "#bbb", fontSize: 10 }}>@{u.username}</div>
                            </div>
                            {status === "friends" ? (
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#22c55e" }}>check_circle</span>
                            ) : status === "pending_sent" ? (
                              <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>Sent</span>
                            ) : status === "pending_received" ? (
                              <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>Respond</span>
                            ) : (
                              <button
                                onClick={() => sendFriendRequest(u.id)}
                                disabled={sendingReq[u.id] === "loading"}
                                style={{
                                  width: 28, height: 28, borderRadius: "50%", border: "none",
                                  background: sendingReq[u.id] === "loading" ? "#e0e0e0" : INK,
                                  color: "#fff", cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ══ FRIEND SCORES MODAL ══ */}
          {friendScores && createPortal(
            <div style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center",
            }} onClick={() => setFriendScores(null)}>
              <div style={{
                background: "#fff", borderRadius: 28, padding: "24px 24px 20px",
                width: 360,
                boxShadow: "0 24px 64px rgba(0,0,0,.2)",
              }} onClick={e => e.stopPropagation()}>
                {/* Friend header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", background: "#e8e8f0",
                    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {friendScores.friend.avatar_emochi
                      ? <img src={`/idle/${friendScores.friend.avatar_emochi.toLowerCase()}.png`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#aaa" }}>person</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: INK }}>{friendScores.friend.display_name || friendScores.friend.username}</div>
                    <div style={{ color: "#bbb", fontSize: 11 }}>@{friendScores.friend.username}</div>
                  </div>
                  <button onClick={() => setFriendScores(null)} style={{
                    marginLeft: "auto", width: 26, height: 26, borderRadius: "50%",
                    background: "#f0f0f0", border: "none", cursor: "pointer", fontSize: 12, color: "#777",
                  }}>✕</button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 11, color: "#bbb", letterSpacing: 1.5, marginBottom: 10 }}>EMOCHI SQUAD</div>
                {friendScoresLoading ? (
                  <div style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading…</div>
                ) : !friendScores.scores || Object.keys(friendScores.scores).length === 0 ? (
                  <div style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No scores yet</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 8px" }}>
                    {CHARS.filter(c => !c.noLevel).map(c => {
                      const data = friendScores.scores[c.id];
                      const level = data?.level ?? 0;
                      const score = data?.score ?? 0;
                      const pct = Math.min(score, 100);
                      const r = 27;
                      const circ = 2 * Math.PI * r;
                      const filled = (pct / 100) * circ;
                      return (
                        <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          {/* Donut ring + avatar */}
                          <div style={{ position: "relative", width: 62, height: 62 }}>
                            <svg width="62" height="62" viewBox="0 0 62 62" style={{ position: "absolute", inset: 0 }}>
                              <circle cx="31" cy="31" r={r} fill="none" stroke="#f0f0f0" strokeWidth="4.5" />
                              <circle cx="31" cy="31" r={r} fill="none" stroke={c.color} strokeWidth="4.5"
                                strokeDasharray={`${filled} ${circ - filled}`}
                                strokeLinecap="round"
                                transform="rotate(-90 31 31)"
                                style={{ transition: "stroke-dasharray .6s ease" }}
                              />
                            </svg>
                            <div style={{
                              position: "absolute", inset: 7, borderRadius: "50%",
                              background: c.color + "15", overflow: "hidden",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <img src={`/idle/${c.file.toLowerCase()}`} alt={c.name}
                                style={{ width: "88%", height: "88%", objectFit: "contain" }} />
                            </div>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: INK, textAlign: "center", lineHeight: 1.2 }}>{c.name}</div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: "#bbb", textAlign: "center" }}>
                            Lv.{level} <span style={{ color: c.color }}>▲{score}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

          {/* ══ CLOUD STAT WIDGET ══ */}
          <div style={{ position: "absolute", top: 90, left: 60, zIndex: 25 }}>
            <CloudWidget
              stats={stats}
              cloudTab={cloudTab}
              onCycle={() => setCloudTab(t => (t + 1) % 3)}
            />
          </div>

          {/* ══ WISEY DAILY SUGGESTION ══ */}
          {(() => {
            const wiseyChar = CHARS.find(c => c.id === "wisey");
            const tips = wiseyLoading
              ? ["Thinking about your day…"]
              : wiseyTips?.length > 0 ? wiseyTips : getWiseySuggestions(stats);
            const tip = tips[wiseyIdx % tips.length];
            return (
              <div style={{
                position: "absolute", top: 100, left: "50%",
                transform: "translateX(-50%)",
                zIndex: 25, display: "flex", alignItems: "flex-start", gap: 10,
                maxWidth: 460, width: "max-content",
              }}>
                {/* Wisey avatar bubble */}
                <div style={{
                  width: 58, height: 58, borderRadius: "50%",
                  background: wiseyChar.color + "22",
                  border: `2.5px solid ${wiseyChar.color}`,
                  position: "relative", overflow: "hidden", flexShrink: 0,
                  boxShadow: `0 4px 16px ${wiseyChar.color}55`,
                }}>
                  <Image src={`/idle/${wiseyChar.file.toLowerCase()}`} alt="Wisey" fill style={{ objectFit: "cover" }} />
                </div>
                {/* Message bubble */}
                <div
                  onClick={() => tips.length > 1 && setWiseyIdx(i => (i + 1) % tips.length)}
                  style={{
                    background: "rgba(255,255,255,.92)",
                    backdropFilter: "blur(14px)",
                    borderRadius: "4px 20px 20px 20px",
                    padding: "14px 22px 16px",
                    boxShadow: "0 6px 28px rgba(0,0,0,.12)",
                    border: `1px solid ${wiseyChar.color}30`,
                    cursor: tips.length > 1 ? "pointer" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: wiseyChar.color, letterSpacing: .3 }}>
                      Wisey
                    </div>
                    {tips.length > 1 && (
                      <div style={{ display: "flex", gap: 5 }}>
                        {tips.map((_, i) => (
                          <div key={i} style={{
                            width: i === wiseyIdx % tips.length ? 14 : 6, height: 6, borderRadius: 4,
                            background: i === wiseyIdx % tips.length ? wiseyChar.color : "#ddd",
                            transition: "all .3s",
                          }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    key={tip}
                    style={{
                      fontSize: 16, fontWeight: 600, color: "#29293a",
                      lineHeight: 1.6, maxWidth: 420, whiteSpace: "pre-wrap",
                      animation: "wiseyFade .4s ease",
                    }}
                  >
                    {tip}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══ CHARACTERS GROUP ══ */}
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 160,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            {enrichedChars.map(c => (
              <CharNode
                key={c.id} char={c}
                hovered={hovChar === c.id}
                onEnter={() => setHovChar(c.id)}
                onLeave={() => setHovChar(null)}
                onClick={rect => setCharPopup({ char: c, rect })}
              />
            ))}
          </div>

          {/* ══ DEBATE BUTTON ══ */}
          <div style={{
            position: "absolute", left: 0, right: 0,
            bottom: 36, display: "flex", justifyContent: "center",
          }}>
            <button onClick={() => router.push("/debate")} className="btn-debate" style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "17px 52px", borderRadius: 16,
              background: "linear-gradient(135deg,#1a1a2e 0%,#2e1f5e 100%)",
              border: "1.5px solid rgba(201,168,87,.28)", cursor: "pointer",
            }}>
              <span style={{ fontSize: 18 }}>⚖️</span>
              <span style={{
                background: "linear-gradient(90deg,#f7d774,#c9a857)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                fontWeight: 800, fontSize: 20, letterSpacing: 4,
              }}>DEBATE</span>
            </button>
          </div>

          {/* ══ CHARACTER SPEECH CLOUD ══ */}
          {charPopup && createPortal(
            <div
              onClick={() => setCharPopup(null)}
              style={{
                position: "fixed", inset: 0, zIndex: 9997,
                background: "rgba(10,8,28,.65)",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Agent — exact original screen position */}
              <div style={{
                position: "absolute",
                left: charPopup.rect.left,
                top: charPopup.rect.top,
                width: charPopup.rect.width,
                height: charPopup.rect.height,
                pointerEvents: "none",
                filter: `drop-shadow(0 16px 40px ${charPopup.char.color}88)`,
                animation: "cloudPop .25s ease",
              }}>
                <Image src={`/idle/${charPopup.char.file.toLowerCase()}`} alt={charPopup.char.name} fill style={{ objectFit: "contain" }} />
              </div>

              {/* CSS conversation cloud — auto-sizes to text, no PNG */}
              {(() => {
                const vw = typeof window !== "undefined" ? window.innerWidth : 1600;
                const vh = typeof window !== "undefined" ? window.innerHeight : 900;
                const CLOUD_W = Math.min(520, vw - 48);
                const agentCenterX = charPopup.rect.left + charPopup.rect.width / 2;
                const cloudLeft = Math.max(20, Math.min(agentCenterX - CLOUD_W / 2, vw - CLOUD_W - 20));
                // Tail tip aligns with agent center; clamped within cloud bounds
                const tailX = Math.max(20, Math.min(agentCenterX - cloudLeft - 14, CLOUD_W - 48));
                // Cloud bottom edge sits 38px above agent top (gap + tail height)
                const cloudBottom = vh - charPopup.rect.top + 38;

                return (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      left: cloudLeft,
                      bottom: cloudBottom,
                      width: CLOUD_W,
                      animation: "slideUp .3s cubic-bezier(.34,1.56,.64,1)",
                      zIndex: 3,
                    }}
                  >
                    {/* Cloud body — grows to fit content */}
                    <div style={{
                      position: "relative",
                      background: "linear-gradient(160deg,#fff 0%,#f0f2fa 100%)",
                      borderRadius: 22,
                      padding: "22px 26px 20px",
                      boxShadow: "0 8px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.06)",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}>
                      {/* Agent name + level/score */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{
                          color: charPopup.char.color,
                          fontSize: 22,
                          fontWeight: 900,
                          lineHeight: 1.1,
                        }}>
                          {charPopup.char.name}
                        </div>
                        {!charPopup.char.noLevel && (
                          <div style={{
                            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0,
                          }}>
                            <div style={{
                              fontSize: 13, fontWeight: 800, color: charPopup.char.color,
                              background: charPopup.char.color + "18", borderRadius: 20,
                              padding: "3px 10px", border: `1px solid ${charPopup.char.color}40`,
                            }}>
                              Lv.{charPopup.char.level}
                            </div>
                            {charPopup.char.score != null && (
                              <div style={{
                                fontSize: 12, fontWeight: 700,
                                color: charPopup.char.score > charPopup.char.level ? "#22c55e"
                                     : charPopup.char.score < charPopup.char.level ? "#ef4444" : "#aaa",
                              }}>
                                {charPopup.char.score > charPopup.char.level ? `▲ ${charPopup.char.score} pts`
                                 : charPopup.char.score < charPopup.char.level ? `▼ ${charPopup.char.score} pts`
                                 : `${charPopup.char.score} pts`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Role pill */}
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "5px 14px",
                        borderRadius: 999,
                        background: charPopup.char.color + "18",
                        border: `1px solid ${charPopup.char.color}45`,
                        color: charPopup.char.color,
                        fontSize: 12,
                        fontWeight: 800,
                        width: "fit-content",
                      }}>
                        ✦ {charPopup.char.role}
                      </div>

                      {/* Intro text — unclamped, cloud expands */}
                      <p style={{
                        margin: 0,
                        color: "#29293a",
                        fontSize: 15,
                        fontWeight: 500,
                        lineHeight: 1.65,
                      }}>
                        {charPopup.char.intro}
                      </p>
                    </div>

                    {/* Triangle tail pointing down toward agent */}
                    <div style={{
                      position: "absolute",
                      bottom: -18,
                      left: tailX,
                      width: 0,
                      height: 0,
                      borderLeft: "14px solid transparent",
                      borderRight: "14px solid transparent",
                      borderTop: "20px solid #f0f2fa",
                      filter: "drop-shadow(0 4px 4px rgba(0,0,0,.08))",
                      zIndex: 2,
                    }} />
                  </div>
                );
              })()}

              {/* close hint */}
              <div style={{
                position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
                color: "rgba(255,255,255,.32)", fontSize: 11, letterSpacing: 1.5, pointerEvents: "none",
              }}>
                CLICK ANYWHERE TO CLOSE
              </div>
            </div>
          , document.body)}

          {/* ══ LOGOUT BUTTON ══ */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn-logout"
            style={{
              position: "absolute", bottom: 28, right: 28, zIndex: 25,
              display: "flex", alignItems: "center", gap: 8,
              padding: "13px 26px", borderRadius: 30,
              background: "#f05a3a", border: "none",
              cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#fff",
              boxShadow: "0 4px 16px rgba(240,90,58,.4)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>

          {/* ══ PROFILE MODAL ══ */}
          {profileOpen && createPortal(
            <div
              onClick={() => { setProfile(false); setAvatarPickerOpen(false); setCardFlipped(false); setEditingProfile(false); setEditingName(false); }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(10px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {/* Avatar picker popup */}
              {avatarPickerOpen && (
                <div onClick={e => e.stopPropagation()} style={{
                  position: "absolute", zIndex: 10000, background: "#fff", borderRadius: 24,
                  padding: "20px 20px 16px", boxShadow: "0 20px 60px rgba(0,0,0,.28)",
                  width: 370, maxHeight: "70vh", overflowY: "auto",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: INK }}>Choose Avatar</div>
                    <button onClick={() => setAvatarPickerOpen(false)} style={{ width: 28, height: 28, borderRadius: "50%", background: "#f4f4f4", border: "none", cursor: "pointer", fontSize: 13, color: "#777" }}>✕</button>
                  </div>
                  {["Classic", "Winner"].map(variant => (
                    <div key={variant} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#bbb", marginBottom: 8 }}>{variant.toUpperCase()}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                        {AVATAR_OPTIONS.filter(o => o.variant === variant).map(o => (
                          <div key={o.key} onClick={() => saveAvatar(o.key)}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                            <div style={{
                              width: 64, height: 64, borderRadius: 14, background: o.color + "18",
                              border: `2.5px solid ${editAvatar === o.key ? o.color : "transparent"}`,
                              position: "relative", overflow: "hidden",
                              boxShadow: editAvatar === o.key ? `0 0 0 3px ${o.color}44` : "none",
                              transition: "box-shadow .15s, border-color .15s",
                            }}>
                              <Image src={o.src} alt={o.name} fill style={{ objectFit: "contain", padding: 4 }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: editAvatar === o.key ? o.color : "#aaa" }}>{o.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Flip card ── */}
              {(() => {
                const baseId = (editAvatar ?? "wisey").replace(/-winner$/, "");
                const avatarChar = enrichedChars.find(c => c.id === baseId) ?? enrichedChars[4];
                const aColor = avatarChar?.color ?? "#C9A857";
                const avatarSrc = getAvatarSrc(editAvatar);
                const GOLD = "linear-gradient(145deg, #f5e07a, #C9A857, #8a6a1f, #e0c070, #C9A857, #f5e07a)";
                const CARD_H = 460;
                return (
                  <div style={{ perspective: "1000px", width: 360 }} onClick={e => e.stopPropagation()}>
                    <div style={{
                      position: "relative", width: 360, height: CARD_H,
                      transformStyle: "preserve-3d",
                      transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
                      transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}>

                      {/* ══ FRONT FACE ══ */}
                      <div
                        onClick={() => { setAvatarPickerOpen(false); setCardFlipped(true); }}
                        style={{
                          position: "absolute", inset: 0, backfaceVisibility: "hidden", cursor: "pointer",
                          background: GOLD, borderRadius: 28, padding: 3,
                          boxShadow: `0 28px 70px rgba(0,0,0,.4), 0 0 40px ${aColor}33`,
                        }}
                      >
                        <div style={{ background: "#fdfcf8", borderRadius: 26, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                          {/* Art banner */}
                          <div style={{
                            position: "relative", height: 220, flexShrink: 0,
                            background: `radial-gradient(ellipse at 50% 110%, ${aColor}55 0%, ${aColor}22 50%, #f0ede4 100%)`,
                            display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden",
                          }}>
                            <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: `1.5px solid ${aColor}22`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                            <div style={{ position: "absolute", width: 210, height: 210, borderRadius: "50%", border: `1.5px solid ${aColor}33`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                            <div onClick={e => { e.stopPropagation(); setAvatarPickerOpen(o => !o); }} style={{ position: "relative", width: 168, height: 168, cursor: "pointer", flexShrink: 0 }}>
                              <Image src={avatarSrc} alt="avatar" fill style={{ objectFit: "contain", filter: `drop-shadow(0 8px 24px ${aColor}88)` }} />
                              <div style={{ position: "absolute", bottom: 6, right: 6, width: 28, height: 28, borderRadius: "50%", background: "#fff", border: `2px solid ${aColor}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.18)" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14, color: aColor }}>photo_camera</span>
                              </div>
                            </div>
                          </div>

                          {/* Body */}
                          <div style={{ padding: "16px 22px 0", flex: 1, display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
                            {/* Name + edit */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                              {editingName ? (
                                <>
                                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} maxLength={24}
                                    style={{ flex: 1, padding: "5px 10px", borderRadius: 10, border: `1.5px solid ${aColor}`, fontSize: 18, fontWeight: 900, color: INK, outline: "none", fontFamily: "inherit", background: "#fff" }} />
                                  <button onClick={saveDisplayName} style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: aColor, color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>Save</button>
                                  <button onClick={() => { setEditName(userName); setEditingName(false); }} style={{ padding: "5px 8px", borderRadius: 20, border: "none", cursor: "pointer", background: "#f0f0ee", color: "#888", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>✕</button>
                                </>
                              ) : (
                                <>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: INK, letterSpacing: -.3 }}>{editName}</div>
                                  <button onClick={() => setEditingName(true)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: aColor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: aColor }}>edit</span>
                                  </button>
                                </>
                              )}
                            </div>
                            {userUsername && <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 14 }}>@{userUsername}</div>}
                            <div style={{ height: 1, background: `linear-gradient(90deg, ${aColor}44, transparent)`, marginBottom: 14 }} />

                            {/* MBTI */}
                            <div style={{ textAlign: "center", marginBottom: 14 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#bbb", marginBottom: 4 }}>PERSONALITY TYPE</div>
                              {profileMbti
                                ? <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 8, color: aColor, lineHeight: 1 }}>{profileMbti}</div>
                                : <div style={{ fontSize: 11, color: "#ccc" }}>Take the quiz to discover your type</div>}
                            </div>

                            <div style={{ flex: 1 }} />
                            {/* Bottom row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
                              {!confirmDelete ? (
                                <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }} title="Delete account" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                  </svg>
                                </button>
                              ) : (
                                <div onClick={e => e.stopPropagation()} style={{ flex: 1, background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 14, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 2 }}>Delete account?</div>
                                  <div style={{ fontSize: 10, color: "#aaa", marginBottom: 8 }}>This cannot be undone.</div>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "6px 0", borderRadius: 16, background: "#f0f0f0", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10, color: "#777" }}>Cancel</button>
                                    <button onClick={deleteAccount} style={{ flex: 1, padding: "6px 0", borderRadius: 16, background: "#ef4444", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10, color: "#fff" }}>Yes, delete</button>
                                  </div>
                                </div>
                              )}
                              {!confirmDelete && (
                              <button
                                onClick={e => { e.stopPropagation(); setCardFlipped(true); }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${aColor}44`,
                                  background: aColor + "12", cursor: "pointer", color: aColor,
                                  fontWeight: 700, fontSize: 11,
                                }}>
                                Interests
                                <span style={{ fontSize: 13 }}>→</span>
                              </button>
                            )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ══ BACK FACE ══ */}
                      <div
                        onClick={() => !editingProfile && setCardFlipped(false)}
                        style={{
                          position: "absolute", inset: 0, backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)", cursor: editingProfile ? "default" : "pointer",
                          background: GOLD, borderRadius: 28, padding: 3,
                          boxShadow: `0 28px 70px rgba(0,0,0,.4), 0 0 40px ${aColor}33`,
                        }}
                      >
                        <div style={{ background: "#fdfcf8", borderRadius: 26, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                          {/* Decorative top band */}
                          <div style={{
                            height: 8, flexShrink: 0,
                            background: `linear-gradient(90deg, ${aColor}88, ${aColor}22, ${aColor}88)`,
                          }} />

                          <div style={{ padding: "18px 22px 18px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }} onClick={e => e.stopPropagation()}>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#bbb" }}>INTERESTS</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {!editingProfile && (
                                  <button onClick={() => { setEditInterests([...profileInterests]); setEditingProfile(true); }}
                                    style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: aColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: aColor }}>edit</span>
                                  </button>
                                )}
                                <button onClick={() => setCardFlipped(false)}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, border: "1.5px solid #e0e0e0", cursor: "pointer", background: "#f5f5f3", fontSize: 11, fontWeight: 700, color: "#888" }}>← Back</button>
                              </div>
                            </div>

                            {/* Interests content */}
                            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
                              {editingProfile ? (
                                <>
                                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 10, color: editInterests.length === 5 ? "#22c55e" : aColor }}>
                                    {editInterests.length}/5{editInterests.length < 5 ? ` — pick ${5 - editInterests.length} more` : " ✓"}
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, overflowY: "auto", flex: 1, alignContent: "flex-start" }}>
                                    {allInterests.map(name => {
                                      const active = editInterests.includes(name);
                                      const maxed = editInterests.length >= 5 && !active;
                                      return (
                                        <button key={name} disabled={maxed} onClick={() => {
                                          if (active) setEditInterests(prev => prev.filter(i => i !== name));
                                          else if (editInterests.length < 5) setEditInterests(prev => [...prev, name]);
                                        }} style={{
                                          padding: "6px 14px", borderRadius: 20, cursor: maxed ? "not-allowed" : "pointer",
                                          border: `1.5px solid ${active ? aColor : "#e0e0e0"}`,
                                          background: active ? aColor + "18" : "#f7f7f5",
                                          color: active ? aColor : maxed ? "#ccc" : "#999",
                                          fontWeight: 700, fontSize: 11, opacity: maxed ? 0.4 : 1, transition: "all .12s",
                                        }}>{name}</button>
                                      );
                                    })}
                                  </div>
                                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexShrink: 0 }}>
                                    <button onClick={() => { setEditInterests([...profileInterests]); setEditingProfile(false); }} style={{ flex: 1, padding: "10px 0", borderRadius: 30, background: "#f0f0ee", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, color: "#888" }}>Cancel</button>
                                    <button onClick={saveProfile} disabled={savingProfile || editInterests.length !== 5} style={{
                                      flex: 2, padding: "10px 0", borderRadius: 30,
                                      background: `linear-gradient(90deg, ${aColor}, #e0c070)`,
                                      border: "none", cursor: (savingProfile || editInterests.length !== 5) ? "not-allowed" : "pointer",
                                      color: "#fff", fontWeight: 800, fontSize: 12,
                                      opacity: (savingProfile || editInterests.length !== 5) ? 0.5 : 1,
                                    }}>{savingProfile ? "Saving…" : "Save"}</button>
                                  </div>
                                </>
                              ) : profileInterests.length > 0 ? (
                                <>
                                  {/* 2-col grid of big chips */}
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                                    {profileInterests.map((name, i) => (
                                      <div key={name} style={{
                                        padding: "14px 12px", borderRadius: 18,
                                        background: i % 2 === 0 ? aColor + "16" : aColor + "0c",
                                        border: `1.5px solid ${aColor}33`,
                                        display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                                        color: aColor, fontWeight: 800, fontSize: 13, lineHeight: 1.2,
                                        boxShadow: `0 2px 8px ${aColor}18`,
                                      }}>{name}</div>
                                    ))}
                                  </div>

                                  {/* Footer strip — mini avatar + name + MBTI */}
                                  <div style={{ flexShrink: 0, marginTop: "auto" }}>
                                    <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${aColor}33, transparent)`, marginBottom: 14 }} />
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                      <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, position: "relative", background: aColor + "18", border: `2px solid ${aColor}44`, overflow: "hidden" }}>
                                        <Image src={avatarSrc} alt="avatar" fill style={{ objectFit: "contain", padding: 4 }} />
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 900, fontSize: 14, color: INK, marginBottom: 2 }}>{editName}</div>
                                        {userUsername && <div style={{ fontSize: 10, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>@{userUsername}</div>}
                                        {profileMbti && (
                                          <div style={{ display: "inline-block", padding: "2px 10px", borderRadius: 10, background: aColor + "18", border: `1px solid ${aColor}44`, fontSize: 11, fontWeight: 800, color: aColor, letterSpacing: 2 }}>{profileMbti}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: aColor + "12", border: `2px dashed ${aColor}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: aColor + "88" }}>interests</span>
                                  </div>
                                  <div style={{ fontSize: 13, color: "#bbb", fontWeight: 600, textAlign: "center" }}>No interests yet</div>
                                  <button onClick={() => { setEditInterests([]); setEditingProfile(true); }} style={{
                                    padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
                                    background: aColor, color: "#fff", fontWeight: 700, fontSize: 12,
                                  }}>Add interests</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>,
            document.body
          )}

          {/* ══ HISTORY MODAL ══ */}
          {historyOpen && createPortal(
            <div className="modal-overlay" onClick={() => setHistory(false)} style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
              backdropFilter: "blur(10px)", zIndex: 9998,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div className="modal-card" onClick={e => e.stopPropagation()} style={{
                width: "92vw", maxWidth: 1280, height: "88vh",
                background: "#fff", borderRadius: 28, overflow: "hidden",
                boxShadow: "0 40px 100px rgba(0,0,0,.32)",
                display: "flex", flexDirection: "column",
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 36px 16px", flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#C9A857", marginBottom: 3 }}>EMOCHI HISTORY</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>Agent Rankings</div>
                  </div>
                  <button onClick={() => setHistory(false)} style={{
                    width: 36, height: 36, borderRadius: "50%", border: "1px solid #eee",
                    background: "#f7f7f7", color: "#555", cursor: "pointer", fontSize: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✕</button>
                </div>

                {/* Date nav row */}
                {(() => {
                  const dates = getRecentDates();
                  const today = dates[0].key;
                  const yesterday = dates[1].key;
                  const idx = Math.max(0, dates.findIndex(d => d.key === historyDate));
                  const canOlder = idx < dates.length - 1;
                  const canNewer = idx > 0;
                  return (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      padding: "0 36px 18px", flexShrink: 0,
                    }}>
                      {/* Shortcut buttons */}
                      {[{ label: "Today", key: today }, { label: "Yesterday", key: yesterday }].map(s => (
                        <button key={s.key} onClick={() => setHistoryDate(s.key)} style={{
                          padding: "7px 18px", borderRadius: 20,
                          border: historyDate === s.key ? "none" : "1.5px solid #e8e8e8",
                          background: historyDate === s.key ? "#C9A857" : "#fff",
                          color: historyDate === s.key ? "#fff" : "#888",
                          fontWeight: 700, fontSize: 12, cursor: "pointer",
                          transition: "background .15s, color .15s",
                        }}>{s.label}</button>
                      ))}

                      {/* Divider */}
                      <div style={{ width: 1, height: 24, background: "#e8e8e8", margin: "0 4px" }} />

                      {/* Arrow navigator */}
                      <button onClick={() => canOlder && setHistoryDate(dates[idx + 1].key)} style={{
                        width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #e8e8e8",
                        background: canOlder ? "#fff" : "#f7f7f7", color: canOlder ? INK : "#ccc",
                        cursor: canOlder ? "pointer" : "default", fontSize: 18,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>‹</button>
                      <div style={{
                        minWidth: 170, textAlign: "center", fontSize: 14, fontWeight: 800, color: INK,
                        background: "#f7f7fc", borderRadius: 20, padding: "8px 22px", border: "1.5px solid #eee",
                      }}>
                        {dates[idx]?.label ?? "Today"}
                      </div>
                      <button onClick={() => canNewer && setHistoryDate(dates[idx - 1].key)} style={{
                        width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #e8e8e8",
                        background: canNewer ? "#fff" : "#f7f7f7", color: canNewer ? INK : "#ccc",
                        cursor: canNewer ? "pointer" : "default", fontSize: 18,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>›</button>
                    </div>
                  );
                })()}

                {/* Rankings content */}
                {(() => {
                  const ranked = historyScores;
                  const RANK_COLORS = ["#C9A857", "#8b9cb8", "#c97b3a"];
                  const MEDALS = ["🥇", "🥈", "🥉"];

                  const RankCard = ({ char, rank, cardW }) => {
                    const isFirst = rank === 1;
                    return (
                      <div style={{
                        width: cardW, background: "#fff", borderRadius: 16,
                        boxShadow: isFirst
                          ? `0 8px 28px ${char.color}55, 0 2px 8px rgba(0,0,0,.07)`
                          : "0 3px 12px rgba(0,0,0,.08)",
                        border: `2px solid ${rank <= 3 ? char.color + "55" : "#e8e8e8"}`,
                        padding: isFirst ? "12px 8px 10px" : "10px 6px 8px",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        position: "relative", flex: "0 0 auto",
                      }}>
                        {/* Medal */}
                        <div style={{
                          position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                          minWidth: 24, height: 24, borderRadius: 12, padding: "0 6px",
                          background: rank <= 3 ? RANK_COLORS[rank - 1] : "#dedee8",
                          color: rank <= 3 ? "#fff" : "#888",
                          fontSize: 11, fontWeight: 900,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,.16)", border: "2px solid #fff",
                          whiteSpace: "nowrap",
                        }}>
                          {rank <= 3 ? MEDALS[rank - 1] : `#${rank}`}
                        </div>
                        {/* Image — fills flex space */}
                        <div style={{ position: "relative", width: "100%", flex: 1, minHeight: 0 }}>
                          <Image src={`/idle/${char.file.toLowerCase()}`} alt={char.name} fill
                            style={{ objectFit: "contain", filter: isFirst ? `drop-shadow(0 4px 12px ${char.color}88)` : "none" }} />
                        </div>
                        {/* Name */}
                        <div style={{ fontSize: isFirst ? 13 : 11, fontWeight: 800, color: char.color, marginTop: 4, lineHeight: 1 }}>
                          {char.name}
                        </div>
                        {/* Level */}
                        <div style={{
                          background: char.color + "15", border: `1.5px solid ${char.color}44`,
                          borderRadius: 20, padding: "2px 10px", marginTop: 4,
                          fontSize: isFirst ? 11 : 9, fontWeight: 800, color: char.color, lineHeight: 1.4,
                        }}>Lv. {char.level}</div>
                      </div>
                    );
                  };

                  if (historyLoading || ranked === null) return (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f8fc" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#bbb" }}>Loading…</div>
                    </div>
                  );
                  if (ranked.length === 0) return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8f8fc" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#555" }}>No scores for this date</div>
                      <div style={{ fontSize: 13, marginTop: 6, color: "#aaa" }}>Complete the personality quiz to see rankings</div>
                    </div>
                  );

                  const CARD_W = 130;
                  const rows = [
                    { agents: ranked.slice(1, 4), ranks: [2, 3, 4], flex: "1 1 0" },
                    { agents: [ranked[0]],         ranks: [1],       flex: "1 1 0" },
                    { agents: ranked.slice(4, 7),  ranks: [5, 6, 7], flex: "1 1 0" },
                  ];

                  return (
                    <div style={{
                      flex: 1, minHeight: 0,
                      background: "#f8f8fc", borderTop: "1px solid #efefef",
                      display: "flex", flexDirection: "column",
                      padding: "14px 36px 12px", gap: 10, overflow: "hidden",
                    }}>
                      {rows.map(({ agents, ranks, flex: rowFlex }, ri) => (
                        <div key={ri} style={{
                          flex: rowFlex, minHeight: 0,
                          display: "flex", justifyContent: "center", alignItems: "stretch", gap: 16,
                        }}>
                          {agents.map((c, i) => (
                            <RankCard key={c.id} char={c} rank={ranks[i]} cardW={CARD_W} />
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          , document.body)}

          {/* ══ DAILY CHECK-IN POPUP ══ */}
          {checkinOpen && createPortal(
            <div className="modal-overlay" style={{
              position: "fixed", inset: 0, background: "rgba(10,10,30,.55)",
              backdropFilter: "blur(6px)", zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div className="modal-card" style={{
                width: 600, background: "#fff", borderRadius: 28,
                boxShadow: "0 32px 80px rgba(0,0,0,.22)",
                overflow: "hidden",
              }}>

                {/* Header */}
                <div style={{
                  background: "linear-gradient(135deg,#1a1a2e 0%,#2e1f5e 100%)",
                  padding: "22px 28px 18px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "#C9A857", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
                        DAILY CHECK-IN · STEP {checkinDone ? "✓" : checkinStep} OF 3
                      </div>
                      <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                        {checkinDone ? "All done! Your crew has been updated." :
                          checkinStep === 1 ? "How are you feeling today?" :
                          checkinStep === 2 ? "How much did you sleep last night?" :
                          "How many hours of work / study today?"}
                      </div>
                    </div>
                    {/* no close button — check-in is mandatory */}
                  </div>

                  {/* Step dots */}
                  {!checkinDone && (
                    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                      {[1, 2, 3].map(s => (
                        <div key={s} style={{
                          height: 4, borderRadius: 4, flex: 1,
                          background: s <= checkinStep ? "#C9A857" : "rgba(255,255,255,.2)",
                          transition: "background .3s",
                        }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: "24px 28px 28px" }}>

                  {/* ── DONE STATE ── */}
                  {checkinDone && (
                    <div className="checkin-done" style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
                      <div style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>
                        Your feelings shaped your crew today.
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                        {Object.entries(deltas).filter(([, v]) => v !== 0).map(([name, val]) => (
                          <div key={name} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 14px", borderRadius: 30,
                            background: CHAR_COLOR[name] + "18",
                            border: `1.5px solid ${CHAR_COLOR[name]}44`,
                          }}>
                            <span style={{ color: CHAR_COLOR[name], fontWeight: 800, fontSize: 13 }}>{name}</span>
                            <span style={{ fontWeight: 700, fontSize: 13, color: val > 0 ? "#22c55e" : "#ef4444" }}>
                              {val > 0 ? `+${val}` : val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── STEP 1: FEELINGS ── */}
                  {!checkinDone && checkinStep === 1 && (
                    <>
                      <div style={{ color: "#aaa", fontSize: 12, marginBottom: 14 }}>
                        Choose up to 2 feelings
                        {selectedFeelings.length > 0 && (
                          <span style={{ color: "#C9A857", fontWeight: 700 }}> · {selectedFeelings.length}/2 selected</span>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 24 }}>
                        {FEELINGS.map((f, i) => {
                          const sel = selectedFeelings.includes(i);
                          const disabled = !sel && selectedFeelings.length >= 2;
                          return (
                            <button
                              key={f.name}
                              className="feeling-chip"
                              onClick={() => !disabled && toggleFeeling(i)}
                              style={{
                                padding: "12px 6px", borderRadius: 14, cursor: disabled ? "not-allowed" : "pointer",
                                background: sel ? INK : "#fafafa",
                                border: `1.5px solid ${sel ? INK : "#ececec"}`,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                opacity: disabled ? 0.4 : 1,
                              }}
                            >
                              <span style={{ fontSize: 22 }}>{f.emoji}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: sel ? "#fff" : INK }}>{f.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => selectedFeelings.length > 0 && setCheckinStep(2)}
                          style={{
                            padding: "12px 32px", borderRadius: 30,
                            background: selectedFeelings.length > 0
                              ? "linear-gradient(135deg,#1a1a2e,#2e1f5e)"
                              : "#eee",
                            border: "none", cursor: selectedFeelings.length > 0 ? "pointer" : "not-allowed",
                            color: selectedFeelings.length > 0 ? "#f7d774" : "#bbb",
                            fontWeight: 800, fontSize: 14,
                          }}
                        >Continue →</button>
                      </div>
                    </>
                  )}

                  {/* ── STEP 2: SLEEP ── */}
                  {!checkinDone && checkinStep === 2 && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                        {SLEEP_OPTIONS.map((opt, i) => {
                          const sel = selectedSleep === i;
                          return (
                            <button
                              key={opt.label}
                              className="option-btn"
                              onClick={() => setSelectedSleep(i)}
                              style={{
                                padding: "16px 18px", borderRadius: 14, cursor: "pointer",
                                background: sel ? INK : "#fafafa",
                                border: `1.5px solid ${sel ? INK : "#ececec"}`,
                                textAlign: "left",
                              }}
                            >
                              <div style={{ fontWeight: 800, fontSize: 14, color: sel ? "#f7d774" : INK }}>{opt.label}</div>
                              <div style={{ fontSize: 11, color: sel ? "#aaa" : "#bbb", marginTop: 2 }}>{opt.sub}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <button onClick={() => setCheckinStep(1)} style={{
                          padding: "12px 24px", borderRadius: 30,
                          background: "#f5f5f5", border: "1px solid #e8e8e8",
                          cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#777",
                        }}>← Back</button>
                        <button
                          onClick={() => selectedSleep !== null && setCheckinStep(3)}
                          style={{
                            padding: "12px 32px", borderRadius: 30,
                            background: selectedSleep !== null
                              ? "linear-gradient(135deg,#1a1a2e,#2e1f5e)"
                              : "#eee",
                            border: "none", cursor: selectedSleep !== null ? "pointer" : "not-allowed",
                            color: selectedSleep !== null ? "#f7d774" : "#bbb",
                            fontWeight: 800, fontSize: 14,
                          }}
                        >Continue →</button>
                      </div>
                    </>
                  )}

                  {/* ── STEP 3: WORK HOURS ── */}
                  {!checkinDone && checkinStep === 3 && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                        {WORK_OPTIONS.map((opt, i) => {
                          const sel = selectedWork === i;
                          return (
                            <button
                              key={opt.label}
                              className="option-btn"
                              onClick={() => setSelectedWork(i)}
                              style={{
                                padding: "16px 18px", borderRadius: 14, cursor: "pointer",
                                background: sel ? INK : "#fafafa",
                                border: `1.5px solid ${sel ? INK : "#ececec"}`,
                                textAlign: "left",
                              }}
                            >
                              <div style={{ fontWeight: 800, fontSize: 14, color: sel ? "#f7d774" : INK }}>{opt.label}</div>
                              <div style={{ fontSize: 11, color: sel ? "#aaa" : "#bbb", marginTop: 2 }}>{opt.sub}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <button onClick={() => setCheckinStep(2)} style={{
                          padding: "12px 24px", borderRadius: 30,
                          background: "#f5f5f5", border: "1px solid #e8e8e8",
                          cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#777",
                        }}>← Back</button>
                        <button
                          onClick={() => selectedWork !== null && submitCheckin()}
                          style={{
                            padding: "12px 32px", borderRadius: 30,
                            background: selectedWork !== null
                              ? "linear-gradient(135deg,#ff8a3d,#ff5e7a)"
                              : "#eee",
                            border: "none", cursor: selectedWork !== null ? "pointer" : "not-allowed",
                            color: selectedWork !== null ? "#fff" : "#bbb",
                            fontWeight: 800, fontSize: 14,
                          }}
                        >Submit ✓</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          , document.body)}

        </div>
      </div>
    </>
  );
}

/* ── Character node ── */
function CharNode({ char, hovered, onEnter, onLeave, onClick }) {
  const imgRef = useRef(null);
  const w = char.isMain ? char.imgH * 0.92 : char.imgH * 0.80;
  return (
    <div className="char-node" onMouseEnter={onEnter} onMouseLeave={onLeave}
      onClick={() => { const rect = imgRef.current?.getBoundingClientRect(); if (rect) onClick(rect); }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        marginLeft: char.isMain ? -110 : -88,
        transform: hovered ? "translateY(-18px)" : "none",
        zIndex: hovered ? 10 : (char.isMain ? 5 : 1), position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: -52, left: "50%", transform: "translateX(-50%)",
        background: INK, color: "#fff", borderRadius: 30, padding: "5px 14px",
        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
        opacity: hovered ? 1 : 0, transition: "opacity .18s", pointerEvents: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,.15)",
      }}>
        {char.name}
        {!char.noLevel && <span style={{ color: char.color, marginLeft: 6 }}>Lv.{char.level}</span>}
        <span style={{ color: "#aaa", marginLeft: 6, fontSize: 10 }}>click for info</span>
        <div style={{
          position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
          borderTop: `5px solid ${INK}`,
        }} />
      </div>
      <div ref={imgRef} style={{ position: "relative", width: w, height: char.imgH }}>
        <Image src={`/idle/${char.file.toLowerCase()}`} alt={char.name} fill
          style={{
            objectFit: "contain",
            filter: `drop-shadow(0 ${char.isMain ? 18 : 10}px ${char.isMain ? 28 : 14}px rgba(0,0,0,.14))`,
          }}
          priority={char.isMain}
        />
        {!char.noLevel && (
          <div style={{
            position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.92)", borderRadius: 20,
            padding: "3px 10px", backdropFilter: "blur(6px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)", whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: char.color }}>Lv.{char.level}</span>
            {char.score != null && char.score !== char.level ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: char.score > char.level ? "#22c55e" : "#ef4444" }}>
                {char.score > char.level ? `▲${char.score}` : `▼${char.score}`}
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#aaa" }}>{char.score ?? char.level} pts</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Donut stat ── */
function DonutStat({ stat }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const arc  = (stat.pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <svg width="52" height="52" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke={stat.color + "22"} strokeWidth="4.5" />
        <circle cx="20" cy="20" r={r} fill="none"
          stroke={stat.color} strokeWidth="4.5"
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
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

/* ── Cloud stat widget ── */
function CloudWidget({ stats, cloudTab, onCycle }) {
  const TABS = [
    { icon: stats[2].short || "😐", label: "MOOD TODAY",   value: stats[2].pct ? stats[2].pct + "%" : "—", color: "#22c55e" },
    { icon: "🌙",                   label: "SLEEP",        value: stats[0].short || "—",                   color: "#8b5cf6" },
    { icon: "💼",                   label: "WORK HOURS",   value: stats[1].short || "—",                   color: "#f59e0b" },
  ];
  const cur = TABS[cloudTab];
  return (
    <div
      onClick={onCycle}
      title="Click to cycle daily stats"
      style={{
        position: "relative", width: 280, height: 190,
        cursor: "pointer", userSelect: "none",
        animation: "cloudFloat 5s ease-in-out infinite",
      }}
    >
      {/* ground shadow */}
      <div style={{
        position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
        width: 180, height: 20, borderRadius: "50%",
        background: "rgba(80,60,160,.18)", filter: "blur(14px)",
      }} />
      {/* cloud body */}
      <div style={{
        position: "absolute", bottom: 32, left: 10, right: 10, height: 82,
        borderRadius: 54,
        background: "linear-gradient(170deg,#ffffff 0%,#e8e6ff 100%)",
        boxShadow: "0 10px 36px rgba(140,120,255,.3), inset 0 -8px 16px rgba(120,100,220,.12), inset 0 8px 16px rgba(255,255,255,.95)",
      }} />
      {/* left puff */}
      <div style={{
        position: "absolute", bottom: 80, left: 22, width: 84, height: 84,
        borderRadius: "50%",
        background: "linear-gradient(145deg,#ffffff 0%,#dddaff 100%)",
        boxShadow: "0 5px 20px rgba(140,120,255,.28), inset 0 8px 16px rgba(255,255,255,.95)",
      }} />
      {/* center puff (tallest) */}
      <div style={{
        position: "absolute", bottom: 96, left: "50%", transform: "translateX(-50%)",
        width: 108, height: 108, borderRadius: "50%",
        background: "linear-gradient(140deg,#ffffff 0%,#dddaff 100%)",
        boxShadow: "0 6px 28px rgba(140,120,255,.32), inset 0 10px 18px rgba(255,255,255,.95)",
      }} />
      {/* right puff */}
      <div style={{
        position: "absolute", bottom: 78, right: 24, width: 76, height: 76,
        borderRadius: "50%",
        background: "linear-gradient(150deg,#ffffff 0%,#dddaff 100%)",
        boxShadow: "0 5px 18px rgba(140,120,255,.28), inset 0 8px 14px rgba(255,255,255,.95)",
      }} />
      {/* data overlay */}
      <div
        key={cloudTab}
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          paddingBottom: 24, zIndex: 5, pointerEvents: "none",
          animation: "cloudPop .25s ease",
        }}
      >
        <div style={{ fontSize: 34, lineHeight: 1 }}>{cur.icon}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: cur.color, lineHeight: 1.15 }}>{cur.value}</div>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#aaa", letterSpacing: 2, marginTop: 3 }}>{cur.label}</div>
      </div>
      {/* tap hint dots */}
      <div style={{
        position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 5, zIndex: 6,
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: i === cloudTab ? 14 : 6, height: 6, borderRadius: 4,
            background: i === cloudTab ? cur.color : "#ccc",
            transition: "all .3s",
          }} />
        ))}
      </div>
    </div>
  );
}

/* ── Friend row ── */
function FriendRow({ friend }) {
  return (
    <div className="friend-row" style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "8px 20px", cursor: "pointer",
      transition: "background .15s",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%", background: friend.bg, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
      }}>{friend.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: INK, fontWeight: 700, fontSize: 13 }}>{friend.name}</div>
        <div style={{ color: "#bbb", fontSize: 11 }}>{friend.mood}</div>
      </div>
    </div>
  );
}
