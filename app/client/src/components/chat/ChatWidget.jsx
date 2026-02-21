// app/client/src/components/chat/ChatWidget.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/api.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = [
  "Why is HPV overdue?",
  "What happens if I miss a dose?",
  "Explain Tdap in simple terms",
];

export default function ChatWidget({ profileId = "p1", profile, eligibility }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Ask me about vaccine due dates, clinic locations, or what to do next.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const endRef = useRef(null);

  const disclaimer = useMemo(
    () => "This is not medical advice. For personal guidance, consult a clinician.",
    []
  );

  // ✅ Always scroll to latest message
  useEffect(() => {
    // small timeout so DOM updates first
    const t = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 0);
    return () => clearTimeout(t);
  }, [messages.length, loading]);

  async function send(text) {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;

    // optimistic user message
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chat(profileId, trimmed, { profile, eligibility });
      const answerText =
        (res && typeof res === "object" && "answer" in res ? res.answer : res) || "";
      setMessages((m) => [
        ...m,
        { role: "assistant", text: String(answerText || "No response.") },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: e?.message || "Chat failed." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      

      <div style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            style={{ ...styles.chip, opacity: loading ? 0.6 : 1 }}
            onClick={() => send(s)}
            disabled={loading}
            type="button"
            title={s}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={styles.chatBox}>
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={`${m.role}-${idx}`}
              style={{
                ...styles.bubble,
                alignSelf: isUser ? "flex-end" : "flex-start",
                background: isUser ? "#111" : "#fff",
                color: isUser ? "#fff" : "#111",
                border: isUser ? "1px solid #111" : "1px solid #eee",
              }}
            >
              <div style={styles.markdown}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(m.text || "")}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}

        {loading ? (
          <div style={{ fontSize: 12, opacity: 0.65 }}>Assistant is typing…</div>
        ) : null}

        <div ref={endRef} />
      </div>

      <div style={styles.inputRow}>
        <textarea
          style={styles.input}
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          disabled={loading}
          rows={1}
        />
        <button
          style={{ ...styles.button, opacity: loading ? 0.75 : 1 }}
          onClick={() => send(input)}
          disabled={loading}
          type="button"
        >
          Send
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 8, color: "#111" }}>{disclaimer}</div>
    </div>
  );
}

const styles = {
  card: {
    background: "#e8ebee",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 1px 10px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },

  suggestions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    color: "#111",
    marginTop: 1,
    marginBottom: 2,
  },
  chip: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
    textAlign: "left",
  },

  chatBox: {
    height: 260,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    background: "#fafafa",
    border: "1px solid #eee",
    minHeight: 0,
  },

  bubble: {
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 1.35,
    // ✅ prevent invisible/overflowing text
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  inputRow: { display: "flex", gap: 10, marginTop: 2 },

  // textarea styled like input
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    color: "#111",
    resize: "none",
    fontFamily: "inherit",
    fontSize: 14,
    lineHeight: 1.25,
    maxHeight: 120,
    overflowY: "auto",
  },

  button: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    minWidth: 76,
  },

  markdown: {
    fontSize: 14,
  },
};