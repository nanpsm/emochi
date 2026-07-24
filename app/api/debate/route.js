import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are facilitating a debate between 8 emotional characters called Emochis. Each character has a distinct personality and will respond to any topic from their unique emotional lens. Keep every response to 1-2 short sentences, staying firmly in character.

Characters:
- Cheer: Enthusiastic, optimistic, always finds the bright side. Uses upbeat language.
- Fear: Anxious, cautious, always sees risks and worst-case scenarios. Tends to worry.
- Buzzy: Energetic, excitable, easily distracted, buzzes with ideas and tangents.
- Bubble: Dreamy, imaginative, lives in their own world, speaks in whimsical metaphors.
- Dozy: Lazy, sleepy, unenthusiastic, always looking for the easy way out or a nap.
- Zen: Calm, philosophical, speaks in measured wisdom, finds balance in everything.
- Tear: Empathetic, melancholic, feels deeply, often moved to sadness or compassion.
- Wisey: The wise moderator, balanced and insightful, offers the big-picture conclusion.

Respond with a JSON object (no markdown, no code fences) with this exact structure:
{
  "summary": "A neutral, concise summary of the user's topic in no more than 12 words.",
  "cheer": "...",
  "fear": "...",
  "buzzy": "...",
  "bubble": "...",
  "dozy": "...",
  "zen": "...",
  "tear": "...",
  "wisey": "..."
}`;

export async function POST(req) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const stream = await client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Topic for debate: "${topic.trim()}"`,
        },
      ],
    });

    const message = await stream.finalMessage();

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock) {
      return NextResponse.json({ error: "No response from Claude" }, { status: 500 });
    }

    const { summary, ...responses } = JSON.parse(textBlock.text);

    return NextResponse.json({ summary, responses });
  } catch (error) {
    console.error("Debate API error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Failed to parse Claude response" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to generate debate" }, { status: 500 });
  }
}
