import { ArrowLeft, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { serverUrl } from "../App";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";

const PHASES = [
  "Analyzing your idea...",
  "Designing layout & structure...",
  "Writing HTML & CSS...",
  "Adding animations & interactions...",
  "Final quality checks...",
];

function Generate() {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [error, setError] = useState("");

  const handleGenerateWebsite = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await axios.post(
        `${serverUrl}/api/website/generate`,
        { prompt },
        { withCredentials: true },
      );

      setProgress(100);

      setTimeout(() => {
        navigate(`/editor/${result.data.websiteId}`);
      }, 600);
    } catch (error) {
      console.log(error);

      setError(
        error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );

      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      setPhaseIndex(0);
      setProgress(0);
      return;
    }

    let value = 0;
    let phase = 0;

    const interval = setInterval(() => {
      const increment =
        value < 20
          ? Math.random() * 1.5
          : value < 60
            ? Math.random() * 1.2
            : Math.random() * 0.6;

      value += increment;

      if (value >= 93) value = 93;

      phase = Math.min(
        Math.floor((value / 100) * PHASES.length),
        PHASES.length - 1,
      );

      setProgress(Math.floor(value));
      setPhaseIndex(phase);
    }, 1200);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0b] to-[#050505] text-white">
      {/* Navbar */}
      <div className="sticky top-0 z-40 flex justify-center px-4 py-3 backdrop-blur-xl">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="w-full max-w-3xl bg-black/50 border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          <motion.button
            onClick={() => navigate("/")}
            whileHover={{
              scale: 1.08,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg transition"
          >
            <ArrowLeft size={15} />
          </motion.button>

          <span
            className="text-base font-bold"
            style={{
              background: "linear-gradient(90deg, #ffffff, #a855f7, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GenWeb.ai
          </span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
            Build Websites with
            <span
              className="block mt-1"
              style={{
                background:
                  "linear-gradient(135deg, #c084fc, #818cf8, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Real AI Power
            </span>
          </h1>

          <p className="text-zinc-500 text-sm">
            This process may take several minutes. GenWeb.ai focuses on quality,
            not shortcuts.
          </p>
        </motion.div>

        {/* Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        >
          <p className="text-sm font-medium text-zinc-300 mb-2 ml-1">
            Describe your website
          </p>

          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/60">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build your website..."
              className="w-full h-56 px-6 pt-5 pb-28 bg-transparent outline-none resize-none text-sm text-zinc-200 placeholder:text-zinc-600"
            />

            {error && <p className="px-5 text-sm text-red-400 pb-3">{error}</p>}

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/50 backdrop-blur-md px-4 py-3">
              {loading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-400 mb-2">
                    <span>{PHASES[phaseIndex]}</span>
                    <span>{progress}%</span>
                  </div>

                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.8 }}
                    />
                  </div>

                  <div className="text-center text-xs text-zinc-500 mt-2">
                    Estimated time remaining:
                    <span className="text-white font-medium">
                      {" "}
                      ~3–5 minutes
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <motion.button
                  whileHover={{
                    scale: !loading ? 1.04 : 1,
                    boxShadow: !loading
                      ? "0 0 18px rgba(139,92,246,0.35)"
                      : "none",
                  }}
                  whileTap={{ scale: !loading ? 0.96 : 1 }}
                  onClick={handleGenerateWebsite}
                  disabled={!prompt.trim() || loading}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    prompt.trim() && !loading
                      ? "text-white"
                      : "bg-zinc-800/60 text-zinc-500 cursor-not-allowed"
                  }`}
                  style={{
                    background:
                      prompt.trim() && !loading
                        ? "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)"
                        : undefined,
                  }}
                >
                  <Sparkles size={14} />
                  {loading ? "Generating..." : "Generate Website"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Generate;
