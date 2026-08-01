import axios from "axios";
import React, { useEffect, useState, useRef, useCallback } from "react";
import prettier from "prettier/standalone";
import * as parserHtml from "prettier/plugins/html";
import { useParams } from "react-router-dom";
import { serverUrl } from "../App";
import {
  Code2,
  Monitor,
  Rocket,
  Send,
  Square,
  Zap,
  X,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Editor from "@monaco-editor/react";

/* ── Toast ─────────────────────────────────────────────────── */
function Toast({ visible, onClose }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      style={{ animation: "toastIn 0.3s ease forwards" }}
    >
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#1a1a1a] border border-amber-500/30 shadow-2xl shadow-black/60 min-w-[300px]">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-amber-400" fill="currentColor" />
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Not enough credits</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Top up your credits to keep building.
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-300 transition flex-shrink-0 ml-1"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-1.5 h-0.5 rounded-full bg-white/5 overflow-hidden mx-1">
        <div
          className="h-full bg-amber-500/40 rounded-full"
          style={{ animation: "shrink 5s linear forwards" }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(14px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Header ─────────────────────────────────────────────────── */
function Header({ website, onclose }) {
  return (
    <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
      <span className="font-semibold truncate">
        {website?.title || "Untitled Website"}
      </span>
      {onclose && (
        <button onClick={onclose}>
          <X size={18} color="white" />
        </button>
      )}
    </div>
  );
}

/* ── Thinking steps ─────────────────────────────────────────── */
const THINKING_STEPS = [
  { label: "Analyzing your request...", delay: 0 },
  { label: "Understanding your request…", delay: 2000 },
  { label: "Planning layout changes…", delay: 5000 },
  { label: "Improving responsiveness…", delay: 9000 },
  { label: "Applying animations…", delay: 13000 },
  { label: "Finalizing update…", delay: 17000 },
  { label: "Generating code…", delay: 21000 },
];

function ThinkingIndicator() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timers = [];
    THINKING_STEPS.forEach((step, i) => {
      if (i === 0) return;
      const t = setTimeout(() => setStepIndex(i), step.delay);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 flex flex-col gap-2 min-w-[190px]">
        <div className="flex flex-col gap-1.5">
          {THINKING_STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            if (i > stepIndex + 1) return null;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs transition-all duration-500 ${
                  active
                    ? "text-indigo-400"
                    : done
                      ? "text-zinc-600 line-through"
                      : "text-zinc-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    active
                      ? "bg-indigo-400 animate-pulse"
                      : done
                        ? "bg-zinc-600"
                        : "bg-zinc-700"
                  }`}
                />
                {s.label}
              </div>
            );
          })}
        </div>
        <span className="flex gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}

/* ── Editor ─────────────────────────────────────────────────── */
function WebsiteEditor() {
  const [website, setWebsite] = useState(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const iframeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const { id } = useParams();

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setMessages((m) => [...m, { role: "ai", content: "Generation stopped." }]);
  };

  const handleUpdate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setMessages((m) => [...m, { role: "user", content: trimmed }]);

    setPrompt("");
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const result = await axios.post(
        `${serverUrl}/api/website/update/${id}`,
        { prompt: trimmed },
        {
          withCredentials: true,
          signal: abortControllerRef.current.signal,
        },
      );

      // add ai response message
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          content: result.data.message,
        },
      ]);

      // format NEW code from backend
      const formattedCode = await prettier.format(result.data.code || "", {
        parser: "html",
        plugins: [parserHtml],
      });

      // set formatted code
      setCode(formattedCode);
    } catch (err) {
      if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;

      const status = err?.response?.status;
      const message = err?.response?.data?.message || "";

      if (status === 402 || message.toLowerCase().includes("credit")) {
        setShowToast(true);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            content: message || "Something went wrong. Please try again.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [prompt, isLoading, id]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUpdate();
    }
  };

  const handleDeploy = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/website/deploy/${website._id}`,
        {
          withCredentials: true,
        },
      );
      window.open(`${result.data.url}`, "_blank");
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleGetWebsite = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/website/get-by-id/${id}`,
          { withCredentials: true },
        );

        setWebsite(result.data);

        const formattedCode = await prettier.format(
          result.data.latestCode || "",
          {
            parser: "html",
            plugins: [parserHtml],
          },
        );

        setCode(formattedCode);
        setMessages(result.data.conversation || []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Something went wrong while fetching website",
        );
      }
    };

    handleGetWebsite();
  }, [id]);

  useEffect(() => {
    if (!iframeRef.current || !code) return;
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [code]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-red-400">
        {error}
      </div>
    );
  }

  if (!website) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-black text-white overflow-hidden">
      {/* Credits toast */}
      <Toast visible={showToast} onClose={() => setShowToast(false)} />

      {/* Sidebar */}
      <aside className="hidden lg:flex w-[380px] flex-col border-r border-white/10 bg-[#0a0a0a]">
        <Header website={website} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {messages?.length > 0 ? (
            <>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-white text-black rounded-tr-sm"
                        : "bg-white/5 border border-white/10 text-zinc-200 rounded-tl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isLoading && <ThinkingIndicator />}

              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg">
                ✦
              </div>
              <p className="text-zinc-500 text-sm">
                Describe what you want to change and I'll update the website.
              </p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10">
          <div className="flex gap-2 items-center">
            <input
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              value={prompt}
              placeholder="Describe changes..."
              disabled={isLoading}
              className="flex-1 rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-sm outline-none text-white placeholder:text-zinc-500 disabled:opacity-50 transition"
            />

            {isLoading ? (
              <button
                onClick={handleStop}
                title="Stop generation"
                className="p-3 rounded-2xl bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition flex-shrink-0"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                disabled={!prompt.trim()}
                className="p-3 rounded-2xl bg-white text-black hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Preview */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 px-4 flex justify-between items-center border-b border-white/10 bg-black/80">
          <span className="text-xs text-zinc-400">Live Preview</span>
          <div className="flex gap-2">
            {website.deployed ? (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow-md shadow-green-500/30 cursor-default transition"
              >
                <CheckCircle size={14} />
                Deployed
              </button>
            ) : (
              <button
                onClick={handleDeploy}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:scale-105 transition cursor-pointer"
              >
                <Rocket size={14} />
                Deploy
              </button>
            )}

            <button
              onClick={() => setShowChat(true)}
              className="p-2 lg:hidden cursor-pointer hover:bg-white/10 rounded-b-md"
            >
              <MessageSquare size={18} />
            </button>

            <button
              onClick={() => setShowCode(true)}
              className="p-2 cursor-pointer hover:bg-white/10 rounded-md transition"
            >
              <Code2 size={18} />
            </button>
            <button
              onClick={() => setShowFullPreview(true)}
              className="p-2 cursor-pointer hover:bg-white/10 rounded-md transition"
            >
              <Monitor size={18} />
            </button>
          </div>
        </div>

        <iframe
          sandbox="allow-scripts allow-same-origin allow-forms"
          ref={iframeRef}
          title="Live Preview"
          className="flex-1 w-full bg-white"
        />
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 [z-9999] bg-black flex flex-col"
          >
            <Header onclose={() => setShowChat(false)} />
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {messages?.length > 0 ? (
                <>
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-white text-black rounded-tr-sm"
                            : "bg-white/5 border border-white/10 text-zinc-200 rounded-tl-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {isLoading && <ThinkingIndicator />}

                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg">
                    ✦
                  </div>
                  <p className="text-zinc-500 text-sm">
                    Describe what you want to change and I'll update the
                    website.
                  </p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2 items-center">
                <input
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  value={prompt}
                  placeholder="Describe changes..."
                  disabled={isLoading}
                  className="flex-1 rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-sm outline-none text-white placeholder:text-zinc-500 disabled:opacity-50 transition"
                />

                {isLoading ? (
                  <button
                    onClick={handleStop}
                    title="Stop generation"
                    className="p-3 rounded-2xl bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition flex-shrink-0"
                  >
                    <Square size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleUpdate}
                    disabled={!prompt.trim()}
                    className="p-3 rounded-2xl bg-white text-black hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCode && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 h-screen w-full lg:w-[45%] z-[9999] bg-[#1e1e1e] flex flex-col"
          >
            <div className="h-12 px-4 flex justify-between items-center border-b border-white/10 bg-[#1e1e1e]">
              <span className="text-sm font-medium">index.html</span>
              <button onClick={() => setShowCode(false)}>
                <X size={18} />
              </button>
            </div>

            <Editor
              height="100%"
              language="html"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: {
                  enabled: false,
                },
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                wrappingIndent: "indent",
                lineNumbers: "on",
                tabSize: 2,
                insertSpaces: true,
                renderWhitespace: "selection",
                scrollbar: {
                  vertical: "visible",
                  horizontal: "hidden",
                },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullPreview && (
          <motion.div className="fixed inset-0 [z-9999] bg-black">
            <iframe
              sandbox="allow-scripts allow-same-origin allow-forms"
              className="w-full h-full bg-white"
              srcDoc={code}
            />
            <button
              className="absolute top-2 right-6 flex items-center justify-center w-6 h-6   bg-black/60 hover:bg-black/80 rounded-md transition cursor-pointer"
              onClick={() => setShowFullPreview(false)}
            >
              <X size={16} className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WebsiteEditor;
