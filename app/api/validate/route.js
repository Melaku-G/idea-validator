import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const FREE_LIMIT = 3;

export async function POST(request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Check how many reports this user has already generated
  const { count, error: countError } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("Count error:", countError);
  }

  if (count >= FREE_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "limit_reached",
        message: `You have used all ${FREE_LIMIT} free validations. Upgrade to Pro for unlimited access.`,
        count,
        limit: FREE_LIMIT,
      }),
      { status: 403 }
    );
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

    // Save to Supabase
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
      console.error("Supabase error:", JSON.stringify(dbError));
    } else {
      console.log("Supabase save successful!");
    }

    // Return report with usage info
    return new Response(
      JSON.stringify({
        ...report,
        usage: { count: count + 1, limit: FREE_LIMIT },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API error:", error.message || error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to analyze idea" }),
      { status: 500 }
    );
  }
}