import Image from "next/image";

const CHARACTERS = [
  { name: "Bubble", file: "bubble.png",       left: 18, top: 30, size: 220 },
  { name: "Wisey",  file: "wisey-judge.png",  left: 49.5, top: 32.5, size: 185 },
  { name: "Buzzy",  file: "buzzy.png",        left: 78, top: 30, size: 220 },
  { name: "Cheer",  file: "cheer.png",        left: 68, top: 54, size: 210 },
  { name: "Fear",   file: "fear.png",         left: 32, top: 54, size: 200 },
  { name: "Tear",   file: "tear.png",         left: 12, top: 60, size: 220 },
  { name: "Zen",    file: "zen.png",          left: 90, top: 60, size: 220 },
  { name: "Dozy",   file: "dozy.png",         left: 67, top: 76, size: 220 },
];

export default function DebatePage() {
  return (
    <div style={{
      position: "relative",
      width: "100vw", height: "100vh",
      overflow: "hidden",
    }}>
      <div style={{
        position: "relative",
        width: "100%", height: "100%",
      }}>
        <Image
          src="/debate.png"
          alt=""
          fill
          priority
          style={{ objectFit: "fill" }}
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
