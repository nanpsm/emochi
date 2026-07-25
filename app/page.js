"use client";

import { useState, useEffect } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const INK = "#1a1a2e";

const GIFS = [
  "dozy-yarn.gif",
  "cheer-cheerup.gif",
  "tear-crying.gif",
  "fear-sad.gif",
  "bubble-talking.gif",
  "buzzy-busy.gif",
  "zen-fly.gif",
];

const HOLD_MS = 2600;
const FADE_MS = 400;

export default function LoginPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [existingSession, setExistingSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let hideTimer, showTimer;

    function cycle() {
      hideTimer = setTimeout(() => {
        setVisible(false);
        showTimer = setTimeout(() => {
          setIndex((i) => (i + 1) % GIFS.length);
          setVisible(true);
          cycle();
        }, FADE_MS);
      }, HOLD_MS);
    }

    cycle();
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (active) setExistingSession(Boolean(session));
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function handleContinue() {
    if (existingSession) {
      router.push("/home");
      return;
    }
    signIn("microsoft-entra-id", { callbackUrl: "/auth/redirect" });
  }

  return (
    <>
      <style>{`
        .login-ms-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.12); }
        .login-ms-btn { transition: transform .18s, box-shadow .18s; }
        @media (min-width: 1024px) {
          .login-gif-panel { display: flex !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 64,
        background: "#e9e9ec",
        fontFamily: "var(--font-nunito),'Nunito',sans-serif",
        color: INK,
        padding: "24px 10vw",
        overflow: "hidden",
      }}>
        {/* Gif sitting directly on the background, cycling one at a time */}
        <div className="login-gif-panel" style={{
          flex: "0 0 auto",
          width: "30vw", maxWidth: 340, aspectRatio: "1 / 1",
          display: "none",
          alignItems: "center", justifyContent: "center",
        }}>
          <img
            src={`/gif/${GIFS[index]}`}
            alt=""
            style={{
              maxWidth: "100%", maxHeight: "100%",
              width: "auto", height: "auto",
              objectFit: "contain",
              opacity: visible ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease`,
              filter: "drop-shadow(0 20px 30px rgba(26,26,46,.16))",
            }}
          />
        </div>

        {/* White surface: login card only */}
        <div style={{
          flex: "0 0 auto",
          width: "100%", maxWidth: 420,
          background: "#fff",
          borderRadius: 32,
          boxShadow: "0 24px 60px rgba(26,26,46,.14)",
          padding: "56px",
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center",
          gap: 24,
        }}>
          <h1 style={{
            fontFamily: "var(--font-baloo),'Baloo 2',sans-serif",
            fontSize: "clamp(16px,2.2vw,22px)", fontWeight: 800,
            margin: 0, lineHeight: 1.3,
            whiteSpace: "nowrap",
          }}>
            Your <span style={{ color: "#ffb703" }}>Emochi</span> are waiting!
          </h1>

          <button
            onClick={handleContinue}
            disabled={checkingSession}
            className="login-ms-btn"
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, background: "#fff", color: INK,
              border: "1.5px solid #e0e0e0", borderRadius: 14,
              padding: "14px 20px",
              fontFamily: "var(--font-nunito),'Nunito',sans-serif",
              fontWeight: 700, fontSize: 15,
              cursor: checkingSession ? "wait" : "pointer",
              opacity: checkingSession ? .65 : 1,
            }}
          >
            {!existingSession && <MicrosoftLogo />}
            {checkingSession
              ? "Checking your Emochi…"
              : existingSession
                ? "Continue talking with Emochi"
                : "Sign in with Microsoft"}
          </button>
        </div>
      </div>
    </>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
