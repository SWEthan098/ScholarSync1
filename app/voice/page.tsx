"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function Voice() {
  const [tab, setTab] = useState<"chat" | "voice">("chat");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello. I'm your ScholarSync AI Coach. Ask me anything about your career, finances, or academic plan.",
    },
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Text chat ──────────────────────────────────────────────
  const sendText = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textInput.trim() || loading) return;

    const userMessage = textInput.trim();
    setTextInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, user_id: "mock-user-1" }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Unable to reach the backend. Make sure the API is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Voice ──────────────────────────────────────────────────
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      await sendAudio(audioBlob);
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const sendAudio = async (audioBlob: Blob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("user_id", "mock-user-1");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voice/chat`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      const transcript = res.headers.get("X-Transcript") ?? "You said something";
      const replyText = res.headers.get("X-Reply") ?? "";

      setMessages((prev) => [
        ...prev,
        { role: "user", text: transcript },
        { role: "assistant", text: replyText },
      ]);

      const audioBuffer = await res.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(audioBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      source.start();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Unable to reach the backend. Make sure the API is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:underline mb-6 inline-block">
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-1" style={{ color: "#012169" }}>
        AI Career Coach
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Ask about your career path, finances, academic plan, or next steps.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["chat", "voice"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 text-sm font-semibold border-b-2 transition-colors capitalize"
            style={
              tab === t
                ? { borderColor: "#E31837", color: "#E31837" }
                : { borderColor: "transparent", color: "#6b7280" }
            }
          >
            {t === "chat" ? "Text Chat" : "Voice"}
          </button>
        ))}
      </div>

      {/* Messages — shared between both tabs */}
      <div className="flex-1 flex flex-col gap-3 mb-6 overflow-y-auto max-h-96">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? { backgroundColor: "#E31837", color: "#fff" }
                  : { backgroundColor: "#f3f4f6", color: "#012169" }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-gray-100 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Text chat input */}
      {tab === "chat" && (
        <form onSubmit={sendText} className="flex gap-3">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ask your coach something..."
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1"
            style={{ focusRingColor: "#E31837" } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={loading || !textInput.trim()}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "#E31837" }}
          >
            Send
          </button>
        </form>
      )}

      {/* Voice input */}
      {tab === "voice" && (
        <div className="flex flex-col items-center gap-3">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={loading}
            className="w-20 h-20 rounded-full border-2 font-semibold text-sm transition-all disabled:opacity-40"
            style={
              recording
                ? { backgroundColor: "#E31837", color: "#fff", borderColor: "#E31837" }
                : { backgroundColor: "#fff", color: "#012169", borderColor: "#012169" }
            }
          >
            {recording ? "Release" : "Hold"}
          </button>
          <p className="text-sm text-gray-400">
            {loading ? "Processing..." : recording ? "Recording — release to send" : "Hold to speak"}
          </p>
        </div>
      )}
    </main>
  );
}
