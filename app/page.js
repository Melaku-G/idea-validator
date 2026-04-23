"use client";

import { useState } from "react";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Idea Validator
          </h1>
          <p className="text-gray-500 text-lg">
            Paste your business idea and get an AI-powered validation report in seconds.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your business idea
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl p-4 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={5}
            placeholder="e.g. An AI tutoring app for kids that adapts to their learning speed and sends weekly progress reports to parents..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Analyzing your idea..." : "Validate my idea →"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Claude is researching your idea...</p>
          </div>
        )}

        {/* Real AI Report */}
        {report && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Validation Report</h2>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <ScoreCard label="Market size"   score={report.scores.marketSize}   color="indigo" />
              <ScoreCard label="Competition"   score={report.scores.competition}   color="amber"  />
              <ScoreCard label="Monetization"  score={report.scores.monetization}  color="emerald"/>
            </div>

            <Section title="Summary"        content={report.summary} />

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Strengths</h3>
              <ul className="space-y-1">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <span className="text-emerald-500 font-bold">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Risks</h3>
              <ul className="space-y-1">
                {report.risks.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <span className="text-amber-500 font-bold">!</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-indigo-800 mb-1">Recommended next step</h3>
              <p className="text-sm text-indigo-700">{report.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreCard({ label, score, color }) {
  const colors = {
    indigo:  "bg-indigo-50  text-indigo-700  border-indigo-200",
    amber:   "bg-amber-50   text-amber-700   border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <div className="text-3xl font-bold">{score}<span className="text-lg">/10</span></div>
      <div className="text-xs font-medium mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{content}</p>
    </div>
  );
}