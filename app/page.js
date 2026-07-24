"use client";

import { signIn } from "next-auth/react";

const INK = "#1a1a2e";

export default function LoginPage() {
  return (
    <>
      <style>{`
        .login-ms-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.12); }
        .login-ms-btn { transition: transform .18s, box-shadow .18s; }
        @media (min-width: 720px) {
          .login-gif-panel { display: block !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#e9e9ec",
        fontFamily: "var(--font-nunito),'Nunito',sans-serif",
        color: INK,
        padding: 24,
      }}>
        <div style={{
          width: "80vw", height: "80vh",
          background: "#fff",
          borderRadius: 32,
          boxShadow: "0 24px 60px rgba(26,26,46,.14)",
          display: "flex",
          overflow: "hidden",
        }}>
          {/* Left: looped gif */}
          <div className="login-gif-panel" style={{
            flex: "1 1 45%",
            position: "relative",
            display: "none",
            minWidth: 0,
          }}>
            <img
              src="/gif/dozy-yarn.gif"
              alt=""
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          {/* Right: login section */}
          <div style={{
            flex: "1 1 55%",
            display: "flex", flexDirection: "column",
            alignItems: "flex-start", justifyContent: "center",
            padding: "56px",
            gap: 8,
          }}>
            <div style={{
              fontFamily: "var(--font-baloo),'Baloo 2',sans-serif",
              fontSize: 24, fontWeight: 800, letterSpacing: .3, marginBottom: 24,
            }}>
              <span style={{ color: "#ffb703" }}>Emo</span>chi
            </div>

            <h1 style={{
              fontFamily: "var(--font-baloo),'Baloo 2',sans-serif",
              fontSize: "clamp(24px,3vw,32px)", fontWeight: 800,
              margin: "0 0 8px", lineHeight: 1.2,
            }}>
              Welcome back
            </h1>
            <p style={{
              fontSize: 15, color: "#777", fontWeight: 600,
              margin: "0 0 32px", lineHeight: 1.6, maxWidth: 360,
            }}>
              Sign in to continue your journey with your Moodlings.
            </p>

            <button
              onClick={() => signIn("microsoft-entra-id")}
              className="login-ms-btn"
              style={{
                width: "100%", maxWidth: 340,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, background: "#fff", color: INK,
                border: "1.5px solid #e0e0e0", borderRadius: 14,
                padding: "14px 20px",
                fontFamily: "var(--font-nunito),'Nunito',sans-serif",
                fontWeight: 700, fontSize: 15, cursor: "pointer",
              }}
            >
              <MicrosoftLogo />
              Sign in with Microsoft
            </button>

            <p style={{
              fontSize: 12.5, color: "#aaa", fontWeight: 600,
              marginTop: 28, lineHeight: 1.6, maxWidth: 340,
            }}>
              By continuing, you agree to Emochi&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
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
