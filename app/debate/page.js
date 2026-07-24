import Image from "next/image";

const CHARACTERS = [
  { name: "Bubble", file: "bubble.png",       left: 18, top: 34, size: 110 },
  { name: "Wisey",  file: "wisey-judge.png",  left: 49.5, top: 33.5, size: 185 },
  { name: "Buzzy",  file: "buzzy.png",        left: 78, top: 34, size: 110 },
  { name: "Cheer",  file: "cheer.png",        left: 60, top: 54, size: 120 },
  { name: "Fear",   file: "fear.png",         left: 35, top: 54, size: 200 },
  { name: "Tear",   file: "tear.png",         left: 14, top: 60, size: 110 },
  { name: "Zen",    file: "zen.png",          left: 83, top: 60, size: 110 },
  { name: "Dozy",   file: "dozy.png",         left: 66, top: 76, size: 90 },
];

export default function DebatePage() {
  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      background: "#000",
    }}>
      <div style={{
        position: "relative",
        width: "min(100vw, 150vh, 1536px)",
        aspectRatio: "3 / 2",
        overflow: "hidden",
      }}>
        <Image
          src="/debate.png"
          alt=""
          fill
          priority
          style={{ objectFit: "cover" }}
        />

        {CHARACTERS.map((c) => (
          <div
            key={c.name}
            style={{
              position: "absolute",
              left: `${c.left}%`, top: `${c.top}%`,
              transform: "translate(-50%, -50%)",
              width: c.size, height: c.size,
            }}
          >
            <Image
              src={`/idle/${c.file}`}
              alt={c.name}
              width={c.size}
              height={c.size}
              style={{
                width: "100%", height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 10px 14px rgba(0,0,0,.35))",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
