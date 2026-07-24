export default function Loading() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#fdf8ee",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 24, zIndex: 9999,
    }}>
      {/* Logo */}
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <img src="/idle/logo.png" alt="Emochi" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        {/* Spinning gold ring */}
        <svg
          width="120" height="120"
          viewBox="0 0 120 120"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "spin 1.2s linear infinite" }}
        >
          <circle cx="60" cy="60" r="54" fill="none" stroke="#C9A857" strokeWidth="4"
            strokeDasharray="80 260" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{ fontSize: 22, fontWeight: 900, color: "#C9A857", letterSpacing: 1 }}>
        Emochi
      </div>

      {/* Bouncing dots */}
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#C9A857",
            animation: `bounce 0.9s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes spin   { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform: scale(0.6); opacity:.4; } 40% { transform: scale(1); opacity:1; } }
      `}</style>
    </div>
  );
}
