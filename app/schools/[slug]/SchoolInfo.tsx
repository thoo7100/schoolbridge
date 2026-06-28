"use client";

import { useState, useEffect } from "react";

export default function SchoolInfo({ school }: { school: any }) {
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generate = async () => {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `You are a helpful school information assistant. Generate a friendly, informative description and common questions for this school:

School Name: ${school.name}
City: ${school.city}, ${school.state}
Type: ${school.type}
Public/Private: ${school.public ? "Public" : "Private"}
Enrollment: ${school.enrollment || "Unknown"}
Teachers: ${school.teacherCount || "Unknown"}
District: ${school.district || "N/A"}

Respond ONLY with a JSON object in this exact format, no markdown, no extra text:
{
  "description": ""description": "4-6 sentence friendly and detailed description of the school. Include information about the school community, academic environment, notable programs or strengths, what makes it unique, and what a new student moving there might expect.",",
  "commonQuestions": [
    "Question 1 a moving student might ask?",
    "Question 2 about academics or activities?",
    "Question 3 about school culture or size?",
    "Question 4 about sports or clubs?",
    "Question 5 about the surrounding area or community?"
  ]
}`
            }]
          })
        });

        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setDescription(parsed.description || "");
        setQuestions(parsed.commonQuestions || []);
      } catch (e) {
        setDescription(`${school.name} is a ${school.public ? "public" : "private"} ${school.type === "high" ? "high school" : school.type === "middle" ? "middle school" : school.type === "elementary" ? "elementary school" : "school"} located in ${school.city}, ${school.state}.${school.enrollment ? ` It serves approximately ${school.enrollment.toLocaleString()} students.` : ""}`);
        setQuestions([
          "What sports and clubs are available?",
          "How is the academic program structured?",
          "What is the school culture like?",
          "How large are the class sizes?",
          "What is the surrounding neighborhood like?",
        ]);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [school.id]);

  const btnStyle = {
    background: "none", border: "none", padding: 0,
    textAlign: "left" as const, cursor: "pointer", width: "100%",
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* DESCRIPTION */}
      <div style={{
        background: "white", borderRadius: 14, padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
        marginBottom: 16
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#718096", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          🏫 About This School
        </div>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#718096" }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              border: "2px solid #e2e8f0", borderTopColor: "#1a56db",
              animation: "spin 0.8s linear infinite"
            }} />
            <span style={{ fontSize: 14 }}>Generating school info...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <p style={{ fontSize: 15, color: "#2d3748", lineHeight: 1.7, margin: 0 }}>{description}</p>
        )}
      </div>

      {/* COMMON QUESTIONS */}
      {!loading && questions.length > 0 && (
        <div style={{
          background: "white", borderRadius: 14, padding: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0"
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#718096", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
            💡 Common Questions from Moving Students
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((q, i) => (
              <QuestionSuggestion key={i} question={q} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionSuggestion({ question }: { question: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    // Find the question input and fill it
    const input = document.querySelector('input[placeholder="Type your question..."]') as HTMLInputElement;
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(input, question);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleClick} style={{
      background: copied ? "#ebf8ff" : "#f7fafc",
      border: `1px solid ${copied ? "#bee3f8" : "#e2e8f0"}`,
      borderRadius: 10, padding: "10px 14px",
      textAlign: "left", cursor: "pointer", width: "100%",
      fontSize: 14, color: copied ? "#1a56db" : "#2d3748",
      fontWeight: 500, transition: "all 0.15s",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8
    }}>
      <span>💬 {question}</span>
      <span style={{ fontSize: 12, color: "#a0aec0", flexShrink: 0 }}>
        {copied ? "✓ Added!" : "Click to ask →"}
      </span>
    </button>
  );
}