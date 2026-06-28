"use client";

import { auth } from "../../lib/firebase";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import useAuth from "../../hooks/useAuth";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {
  collection, addDoc, query, where, getDocs, doc, updateDoc,
} from "firebase/firestore";

export default function QuestionBox({ slug, schoolName }: { slug: string; schoolName?: string }) {
  const user = useAuth();
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [sort, setSort] = useState("newest");
  const [activeReply, setActiveReply] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e: any) {
      if (e.code !== "auth/cancelled-popup-request") console.error(e);
    }
  };

  const loadQuestions = async () => {
    const q = query(collection(db, "questions"), where("schoolId", "==", slug));
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as {
        upvotes?: number; createdAt: number; upvotedBy?: string[];
        replies?: any[]; text?: string; username?: string; schoolId?: string;
      }),
    }));
    if (sort === "popular") {
      data.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      data.sort((a, b) => b.createdAt - a.createdAt);
    }
    setQuestions(data);
  };

  useEffect(() => { loadQuestions(); }, [slug, sort]);

  const submitQuestion = async () => {
    if (!question || !user) return;
    await addDoc(collection(db, "questions"), {
      schoolId: slug, text: question, createdAt: Date.now(),
      upvotes: 0, upvotedBy: [], replies: [],
      userId: user.uid, username: user.displayName || "Anonymous",
    });
    setQuestion("");
    loadQuestions();
  };

  const upvote = async (id: string, q: any) => {
    if (!user) return;
    const ref = doc(db, "questions", id);
    let upvotedBy = q.upvotedBy || [];
    const hasUpvoted = upvotedBy.includes(user.uid);
    upvotedBy = hasUpvoted
      ? upvotedBy.filter((u: string) => u !== user.uid)
      : [...upvotedBy, user.uid];
    await updateDoc(ref, { upvotedBy, upvotes: upvotedBy.length });
    loadQuestions();
  };

  const addReply = async (questionId: string, replies: any[]) => {
    if (!user) return;
    const text = replyTexts[questionId];
    if (!text) return;
    const ref = doc(db, "questions", questionId);
    await updateDoc(ref, {
      replies: [...(replies || []), {
        text, createdAt: Date.now(),
        username: user.displayName || "Anonymous",
      }],
    });
    setReplyTexts((prev) => ({ ...prev, [questionId]: "" }));
    setActiveReply(null);
    loadQuestions();
  };

  const btnBase = {
    border: "none", borderRadius: 8, cursor: "pointer",
    fontWeight: 600, fontSize: 14, padding: "8px 16px",
  };

  return (
    <div>
      {/* LOGIN CARD */}
      <div style={{
        background: "white", borderRadius: 14, padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        border: "1px solid #e2e8f0", marginBottom: 24
      }}>
        {!user ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#718096", marginBottom: 16, fontSize: 15 }}>
              Sign in to ask questions, reply, and upvote
            </p>
            <button onClick={login} style={{
              ...btnBase,
              background: "#1a56db", color: "white",
              padding: "10px 24px", fontSize: 15,
              display: "inline-flex", alignItems: "center", gap: 8
            }}>
              🔐 Sign in with Google
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, color: "#1a202c" }}>👤 {user.displayName}</span>
            <button onClick={() => signOut(auth)} style={{
              ...btnBase, background: "#fed7d7", color: "#c53030"
            }}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ASK QUESTION */}
      <div style={{
        background: "white", borderRadius: 14, padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        border: "1px solid #e2e8f0", marginBottom: 24
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1a202c" }}>
          💬 Ask a Question
        </h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={user ? "Type your question..." : "Sign in to ask a question"}
            disabled={!user}
            onKeyDown={(e) => e.key === "Enter" && submitQuestion()}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 15,
              background: user ? "white" : "#f7fafc",
              outline: "none", color: "#1a202c"
            }}
          />
          <button
            onClick={submitQuestion}
            disabled={!user || !question}
            style={{
              ...btnBase,
              background: user && question ? "#1a56db" : "#e2e8f0",
              color: user && question ? "white" : "#a0aec0",
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* SORT TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["newest", "popular"].map((s) => (
          <button key={s} onClick={() => setSort(s)} style={{
            ...btnBase,
            background: sort === s ? "#1a56db" : "white",
            color: sort === s ? "white" : "#4a5568",
            border: "1px solid #e2e8f0",
            textTransform: "capitalize"
          }}>
            {s === "newest" ? "🕐 Newest" : "🔥 Popular"}
          </button>
        ))}
      </div>

      {/* QUESTIONS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {questions.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 14, padding: 40,
            textAlign: "center", color: "#a0aec0",
            border: "1px solid #e2e8f0"
          }}>
            No questions yet — be the first to ask!
          </div>
        ) : (
          questions.map((q) => {
            const hasUpvoted = user && (q.upvotedBy || []).includes(user.uid);
            return (
              <div key={q.id} style={{
                background: "white", borderRadius: 14, padding: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, color: "#1a56db", fontSize: 14 }}>
                      {q.username}
                    </span>
                    <p style={{ marginTop: 4, color: "#1a202c", fontSize: 15 }}>{q.text}</p>
                  </div>
                  <button onClick={() => upvote(q.id, q)} style={{
                    ...btnBase,
                    background: hasUpvoted ? "#ebf8ff" : "#f7fafc",
                    color: hasUpvoted ? "#1a56db" : "#718096",
                    border: `1px solid ${hasUpvoted ? "#bee3f8" : "#e2e8f0"}`,
                    display: "flex", alignItems: "center", gap: 4,
                    marginLeft: 12, flexShrink: 0
                  }}>
                    👍 {q.upvotes || 0}
                  </button>
                </div>

                {/* REPLIES */}
                {q.replies?.length > 0 && (
                  <div style={{
                    marginTop: 12, paddingTop: 12,
                    borderTop: "1px solid #f0f4f8"
                  }}>
                    {q.replies.map((r: any, i: number) => (
                      <div key={i} style={{
                        marginLeft: 16, padding: "6px 0",
                        fontSize: 14, color: "#4a5568"
                      }}>
                        <span style={{ fontWeight: 700, color: "#2d3748" }}>{r.username}: </span>
                        {r.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* REPLY INPUT */}
                <div style={{ marginTop: 12 }}>
                  {activeReply === q.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={replyTexts[q.id] || ""}
                        onChange={(e) => setReplyTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Write a reply..."
                        onKeyDown={(e) => e.key === "Enter" && addReply(q.id, q.replies || [])}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8,
                          border: "1px solid #e2e8f0", fontSize: 14, outline: "none"
                        }}
                      />
                      <button onClick={() => addReply(q.id, q.replies || [])} style={{
                        ...btnBase, background: "#1a56db", color: "white"
                      }}>Reply</button>
                      <button onClick={() => setActiveReply(null)} style={{
                        ...btnBase, background: "#f7fafc", color: "#718096",
                        border: "1px solid #e2e8f0"
                      }}>Cancel</button>
                    </div>
                  ) : (
                    user && (
                      <button onClick={() => setActiveReply(q.id)} style={{
                        ...btnBase, background: "none", color: "#718096",
                        border: "1px solid #e2e8f0", fontSize: 13, padding: "5px 12px"
                      }}>
                        ↩ Reply
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}