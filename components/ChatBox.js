"use client";
import { useState } from "react";

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const sendMessage = async () => {
    if (!message.trim()) return;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    setReply(data.reply || "Hata oluştu");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Gemini Chat</h1>

      <textarea
        rows="4"
        style={{ width: "100%", marginBottom: 10 }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Mesaj yaz..."
      />

      <button onClick={sendMessage}>
        Gönder
      </button>

      {reply && (
        <div style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
          <strong>Asistan:</strong> {reply}
        </div>
      )}
    </div>
  );
}
