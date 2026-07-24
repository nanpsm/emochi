import Image from "next/image";

const CHARACTERS = [
  { name: "Bubble", file: "Bubble.png", left: 18, top: 34, size: 110 },
  { name: "Wisey",  file: "Wisey.png",  left: 49, top: 27, size: 185 },
  { name: "Buzzy",  file: "Buzzy.png",  left: 78, top: 34, size: 110 },
  { name: "Cheer",  file: "Cheer.png",  left: 32, top: 54, size: 120 },
  { name: "Fear",   file: "Fear.png",   left: 60, top: 54, size: 120 },
  { name: "Tear",   file: "Tear.png",   left: 14, top: 60, size: 110 },
  { name: "Zen",    file: "Zen.png",    left: 83, top: 60, size: 110 },
  { name: "Dozy",   file: "Dozy.png",   left: 66, top: 76, size: 90 },
];

export default function DebatePage() {
  return (
    <div style={{
      position: "relative",
      width: "100%", maxWidth: 1536,
      aspectRatio: "3 / 2",
      margin: "0 auto",
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
            src={`/agents/${c.file}`}
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
  );
}
