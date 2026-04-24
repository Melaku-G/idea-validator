// import { auth } from "@clerk/nextjs/server";
// import { supabase } from "../../../lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export async function POST(request) {
  // Get the logged-in user's ID from Clerk
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { idea } = await request.json();

  if (!idea || !idea.trim()) {
    return new Response(JSON.stringify({ error: "No idea provided" }), {
      status: 400,
    });
  }

  const prompt = `You are a startup analyst. A user has submitted the following business idea:

"${idea}"

Analyze this idea and respond with ONLY a valid JSON object — no markdown, no backticks, no extra text. Use exactly this structure:

{
  "scores": {
    "marketSize": <number 1-10>,
    "competition": <number 1-10>,
    "monetization": <number 1-10>
  },
  "summary": "<2-3 sentence overview of the idea and its potential>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recommendation": "<one concrete next step the founder should take this week>"
}

Be honest, specific, and practical. Base scores on real market dynamics.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenRouter request failed");
    }

    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();
    const report = JSON.parse(clean);

    // Save the report to Supabase
    const { error: dbError } = await supabase.from("reports").insert({
      user_id: userId,
      idea: idea,
      market_size: report.scores.marketSize,
      competition: report.scores.competition,
      monetization: report.scores.monetization,
      summary: report.summary,
      strengths: report.strengths,
      risks: report.risks,
      recommendation: report.recommendation,
    });

    if (dbError) {
      console.error("Supabase error:", dbError);
      // Don't fail the request if saving fails — still return the report
    }

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API error:", error.message || error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to analyze idea" }),
      { status: 500 }
    );
  }
}