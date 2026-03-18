import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface StudentContext {
  name?: string;
  major?: string;
  year?: string;
  careerInterest?: string;
}

function buildSystemPrompt(ctx: StudentContext): string {
  return `You are ScholarSync, an AI career and financial advisor for college students pursuing technology careers.

Student profile:
- Name: ${ctx.name || "Student"}
- Major: ${ctx.major || "Technology"}
- Year: ${ctx.year || "Not specified"}
- Career Interest: ${ctx.careerInterest || "Technology"}

You help with career planning, scholarships, academic decisions, and financial wellness.
Be warm, concise, and specific. You are responding to a voice message so keep answers conversational and under 3 sentences unless a detailed breakdown is clearly needed.`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio      = formData.get("audio") as File;
    const contextRaw = formData.get("context") as string | null;
    const context: StudentContext = contextRaw ? JSON.parse(contextRaw) : {};

    if (!audio) {
      return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
    }

    // 1. Whisper — speech to text
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audio,
    });
    const transcript = transcription.text;

    // 2. GPT-4o — generate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt(context) },
        { role: "user",   content: transcript },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    const replyText = completion.choices[0].message.content ?? "Sorry, I couldn't generate a response.";

    // 3. TTS — text to speech
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: replyText,
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Transcript": encodeURIComponent(transcript),
        "X-Reply":      encodeURIComponent(replyText),
      },
    });

  } catch (err) {
    console.error("Voice error:", err);
    return NextResponse.json({ error: "Voice pipeline failed." }, { status: 500 });
  }
}
