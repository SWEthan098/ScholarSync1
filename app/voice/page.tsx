"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
  date: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  text: "Hello. I'm your ScholarSync AI Coach. Ask me anything about your career, finances, or academic plan.",
};

const STARTER_PROMPTS = [
  "Find scholarships for my profile",
  "How do I become a cloud engineer?",
  "Can I afford an unpaid internship?",
  "How can I improve my GPA?",
  "What internships match my skills?",
  "Review my financial situation",
];

const MOCK_SESSIONS: ChatSession[] = [
  { id: "s1", title: "Scholarship Help",    date: "Mar 12" },
  { id: "s2", title: "Career Path Planning", date: "Mar 8"  },
  { id: "s3", title: "Financial Planning",   date: "Feb 28" },
];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-lg bg-gray-100 flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function WaveformBars() {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[80, 40, 100, 55, 90, 45, 70].map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full animate-bounce"
          style={{
            backgroundColor: "#004F9F",
            height: `${Math.floor(h * 0.16 + 3)}px`,
            animationDelay: `${i * 65}ms`,
          }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Voice() {
  const [messages, setMessages]       = useState<Message[]>([INITIAL_MESSAGE]);
  const [textInput, setTextInput]     = useState("");
  const [recording, setRecording]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [fullscreen, setFullscreen]   = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile]   = useState<string | null>(null);
  const [savedIds, setSavedIds]           = useState<Set<string>>(new Set());
  const [toast, setToast]                 = useState("");
  const [profile, setProfile]             = useState<Record<string, string>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);

  // Load profile from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("scholar_profile");
    if (stored) setProfile(JSON.parse(stored));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Cmd/Ctrl+Enter to send
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (textInput.trim() && !loading && !recording) sendText(textInput.trim());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [textInput, loading, recording]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const appendMessages = (...msgs: Message[]) =>
    setMessages((prev) => [...prev, ...msgs]);

  const newChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setActiveSession(null);
    setUploadedFile(null);
  };

  const loadSession = (s: ChatSession) => {
    setActiveSession(s.id);
    setMessages([
      INITIAL_MESSAGE,
      { id: genId(), role: "user",      text: "Restoring session…" },
      { id: genId(), role: "assistant", text: `Showing your "${s.title}" session. Connect to the backend to restore the full conversation.` },
    ]);
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); showToast("Response saved to dashboard"); }
      return next;
    });
  };

  // ── Text chat ─────────────────────────────────────────────────────────────────

  const sendText = async (text: string) => {
    setTextInput("");
    appendMessages({ id: genId(), role: "user", text });
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: messages.filter((m) => m.id !== "init"),
          context: profile,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      appendMessages({ id: genId(), role: "assistant", text: data.reply });
    } catch {
      appendMessages({ id: genId(), role: "assistant", text: "Unable to reach the AI. Make sure your OpenAI key is set." });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textInput.trim() || loading || recording) return;
    sendText(textInput.trim());
  };

  // ── Voice ─────────────────────────────────────────────────────────────────────

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current   = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach((t) => t.stop());
      await sendAudio(audioBlob);
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const sendAudio = async (audioBlob: Blob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("context", JSON.stringify(profile));
    try {
      const res = await fetch("/api/voice", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const transcript = decodeURIComponent(res.headers.get("X-Transcript") ?? "You said something");
      const replyText  = decodeURIComponent(res.headers.get("X-Reply") ?? "");
      appendMessages(
        { id: genId(), role: "user",      text: transcript },
        { id: genId(), role: "assistant", text: replyText  },
      );
      const audioBuffer = await res.arrayBuffer();
      const audioCtx    = new AudioContext();
      const decoded     = await audioCtx.decodeAudioData(audioBuffer);
      const source      = audioCtx.createBufferSource();
      source.buffer     = decoded;
      source.connect(audioCtx.destination);
      source.start();
    } catch {
      appendMessages({ id: genId(), role: "assistant", text: "Unable to reach the backend. Make sure the API is running." });
    } finally {
      setLoading(false);
    }
  };

  // ── File upload ───────────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file.name);
    appendMessages({ id: genId(), role: "user", text: `📎 Uploaded: ${file.name}` });
    showToast("File attached — ask the coach about it");
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[60] bg-white overflow-auto p-8">
          <ChatContent
            messages={messages}
            textInput={textInput}
            setTextInput={setTextInput}
            recording={recording}
            loading={loading}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
            savedIds={savedIds}
            toggleSave={toggleSave}
            sendText={sendText}
            handleFormSubmit={handleFormSubmit}
            toggleRecording={toggleRecording}
            handleFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            messagesEndRef={messagesEndRef}
            uploadedFile={uploadedFile}
            newChat={newChat}
            showStarterPrompts={messages.length < 3}
          />
        </div>
      )}

      {/* Normal layout */}
      {!fullscreen && (
        <div className="max-w-5xl mx-auto flex gap-6">
          {/* Sidebar */}
          <aside className="w-52 shrink-0 flex flex-col gap-3 pt-1">
            <button
              onClick={newChat}
              className="w-full text-sm font-semibold py-2.5 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#004F9F" }}
            >
              + New Chat
            </button>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mt-1">Recent</p>
            <div className="flex flex-col gap-1">
              {MOCK_SESSIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className="text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-50"
                  style={activeSession === s.id ? { backgroundColor: "#f0f7ff", color: "#004F9F" } : { color: "#374151" }}
                >
                  <p className="font-medium leading-snug truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.date}</p>
                </button>
              ))}
            </div>
          </aside>

          {/* Chat */}
          <div className="flex-1 min-w-0">
            <ChatContent
              messages={messages}
              textInput={textInput}
              setTextInput={setTextInput}
              recording={recording}
              loading={loading}
              fullscreen={fullscreen}
              setFullscreen={setFullscreen}
              savedIds={savedIds}
              toggleSave={toggleSave}
              sendText={sendText}
              handleFormSubmit={handleFormSubmit}
              toggleRecording={toggleRecording}
              handleFileUpload={handleFileUpload}
              fileInputRef={fileInputRef}
              messagesEndRef={messagesEndRef}
              uploadedFile={uploadedFile}
              newChat={newChat}
              showStarterPrompts={messages.length < 3}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ─── ChatContent (shared between normal + fullscreen) ─────────────────────────

interface ChatContentProps {
  messages: Message[];
  textInput: string;
  setTextInput: (v: string) => void;
  recording: boolean;
  loading: boolean;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  savedIds: Set<string>;
  toggleSave: (id: string) => void;
  sendText: (text: string) => void;
  handleFormSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  toggleRecording: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  uploadedFile: string | null;
  newChat: () => void;
  showStarterPrompts: boolean;
}

function ChatContent({
  messages, textInput, setTextInput, recording, loading,
  fullscreen, setFullscreen, savedIds, toggleSave, sendText,
  handleFormSubmit, toggleRecording, handleFileUpload,
  fileInputRef, messagesEndRef, uploadedFile, newChat, showStarterPrompts,
}: ChatContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#004F9F" }}>AI Career Coach</h1>
          <p className="text-sm text-gray-500">Ask about your career path, finances, or academic plan.</p>
        </div>
        <div className="flex items-center gap-2">
          {fullscreen && (
            <button
              onClick={newChat}
              className="text-sm font-semibold px-3 py-2 rounded-lg text-white hover:opacity-90"
              style={{ backgroundColor: "#004F9F" }}
            >
              + New Chat
            </button>
          )}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: "#004F9F", borderColor: "#004F9F" }}
          >
            {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Starter prompts */}
      {showStarterPrompts && (
        <div className="flex gap-2 flex-wrap mb-4">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendText(prompt)}
              disabled={loading}
              className="text-xs px-3 py-2 rounded-full border font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
              style={{ color: "#004F9F", borderColor: "#004F9F" }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat window */}
      <div
        className="bg-white border border-gray-200 rounded-lg p-5 mb-4 overflow-y-auto flex flex-col gap-3 flex-1"
        style={{ minHeight: "320px", maxHeight: fullscreen ? "calc(100vh - 300px)" : "420px" }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className="max-w-xs sm:max-w-md px-4 py-3 rounded-lg text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? { backgroundColor: "#004F9F", color: "#fff" }
                  : { backgroundColor: "#f3f4f6", color: "#1f2937" }
              }
            >
              {msg.text}
            </div>
            {msg.role === "assistant" && msg.id !== "init" && (
              <div className="flex items-center gap-3 mt-1 px-1">
                <CopyButton text={msg.text} />
                <button
                  onClick={() => toggleSave(msg.id)}
                  className="text-xs transition-colors"
                  style={{ color: savedIds.has(msg.id) ? "#FFB81C" : "#9ca3af" }}
                >
                  {savedIds.has(msg.id) ? "Saved ✓" : "Save to Dashboard"}
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Text input row */}
      <form onSubmit={handleFormSubmit} className="flex gap-2 mb-4 items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-2.5 rounded-lg border transition-colors hover:bg-gray-50"
          style={{ color: "#004F9F", borderColor: "#004F9F" }}
          title="Upload resume or transcript"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={uploadedFile ? `Ask about ${uploadedFile}...` : "Type your question… (⌘↵ to send)"}
          disabled={loading || recording}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={loading || !textInput.trim() || recording}
          className="px-5 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
          style={{ backgroundColor: "#004F9F" }}
        >
          Send
        </button>
      </form>

      {/* Voice row */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleRecording}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-lg border-2 font-semibold text-sm transition-all disabled:opacity-40 shrink-0"
          style={
            recording
              ? { backgroundColor: "#004F9F", color: "#fff", borderColor: "#004F9F" }
              : { backgroundColor: "#fff", color: "#004F9F", borderColor: "#004F9F" }
          }
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 8a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V22h-2v-2.06A9 9 0 0 1 3 11H5z"/>
          </svg>
          {recording ? "Stop Recording" : "Start Recording"}
        </button>

        {recording
          ? <WaveformBars />
          : <p className="text-sm text-gray-400">{loading ? "" : "Press Start to speak to your coach"}</p>
        }
      </div>
    </div>
  );
}
