"use client";
import { useEffect, useRef, useState } from "react";

// Audio-only — button lives in each page's navbar.
// Pages control playback by dispatching "emochi:music-toggle".
// This component broadcasts "emochi:music-state" { playing } back.
export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function applyState(shouldPlay) {
    const audio = audioRef.current;
    if (!audio) return;
    if (shouldPlay) {
      audio.play().then(() => {
        setPlaying(true);
        localStorage.setItem("emochi_music", "on");
        window.dispatchEvent(new CustomEvent("emochi:music-state", { detail: { playing: true } }));
      }).catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
      localStorage.setItem("emochi_music", "off");
      window.dispatchEvent(new CustomEvent("emochi:music-state", { detail: { playing: false } }));
    }
  }

  useEffect(() => {
    // Listen for toggle requests from pages
    const onToggle = () => applyState(!playing);
    window.addEventListener("emochi:music-toggle", onToggle);
    return () => window.removeEventListener("emochi:music-toggle", onToggle);
  }, [playing]);

  useEffect(() => {
    // On first user interaction, auto-resume if they left music on
    if (localStorage.getItem("emochi_music") === "on") {
      const resume = () => { applyState(true); window.removeEventListener("click", resume); };
      window.addEventListener("click", resume, { once: true });
    }
  }, []);

  // Broadcast initial state whenever a page mounts and asks
  useEffect(() => {
    const onQuery = () =>
      window.dispatchEvent(new CustomEvent("emochi:music-state", { detail: { playing } }));
    window.addEventListener("emochi:music-query", onQuery);
    return () => window.removeEventListener("emochi:music-query", onQuery);
  }, [playing]);

  return (
    <audio ref={audioRef} src="/music/bg.mp3" loop preload="auto" style={{ display: "none" }} />
  );
}
