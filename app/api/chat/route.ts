import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Message {
  role: "user" | "assistant";
  text: string;
}

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

You help with:
- Career planning, internship strategies, and job searching in tech
- Scholarships, fellowships, grants, and funding opportunities
- Academic planning, GPA management, and course decisions
- Financial wellness — budgeting, tuition gaps, loan repayment
- Tech industry insights and skill-building roadmaps

Be conversational, encouraging, and specific to this student's situation. Keep responses concise and actionable. If you recommend an opportunity or resource, be specific about it.`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, messages, context } = await req.json() as {
      message: string;
      messages: Message[];
      context: StudentContext;
    };

    const systemPrompt = buildSystemPrompt(context ?? {});

    // Build full conversation history for GPT-4o
    const history = (messages ?? []).slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.text,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content ?? "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });

  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ reply: "Something went wrong. Please try again." }, { status: 500 });
  }
}
