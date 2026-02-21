// app/client/src/components/chat/ChatWidget.jsx
import React, { useMemo, useState } from "react";
import { api } from "../../api/api.js"; 
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = [
  "Why is HPV overdue?",
  "Where can I get my flu shot?",
  "What happens if I miss a dose?",
  "Explain Tdap in simple terms"
];

export default function ChatWidget({ profileId = "p1", profile, eligibility }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Ask me about vaccine due dates, clinic locations, or what to do next." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const disclaimer = useMemo(() => "This is not medical advice. For personal guidance, consult a clinician.", []);

  async function send(text) {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chat(profileId, trimmed, {profile, eligibility});
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e.message || "Chat failed." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800 }}>Assistant</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Profile: {profileId}</div>
      </div>

      <div style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button key={s} style={styles.chip} onClick={() => send(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>

      <div style={styles.chatBox}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              ...styles.bubble,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#111" : "#f2f2f2",
              color: m.role === "user" ? "#fff" : "#111"
            }}
          >
            <div style={styles.markdown}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading ? <div style={{ fontSize: 12, opacity: 0.6 }}>Assistant is typing…</div> : null}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
          disabled={loading}
        />
        <button style={styles.button} onClick={() => send(input)} disabled={loading}>
          Send
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>{disclaimer}</div>
    </div>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 14, boxShadow: "0 1px 10px rgba(0,0,0,0.04)" },
  suggestions: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, marginBottom: 10 },
  chip: { padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12 },
  chatBox: { height: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: 10, borderRadius: 12, background: "#fafafa", border: "1px solid #eee" },
  bubble: { maxWidth: "85%", padding: "10px 12px", borderRadius: 14, fontSize: 14, lineHeight: 1.25 },
  inputRow: { display: "flex", gap: 10, marginTop: 10 },
  input: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" },
  button: { padding: "10px 12px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" },
  markdown: { fontSize: 14}
};