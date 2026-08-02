import React, { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import LoginModal from "../components/LoginModal";
import { useDispatch, useSelector } from "react-redux";
import { Coins, LayoutDashboard, LogOut } from "lucide-react";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";

function Home() {
  const highlights = [
    {
      title: "AI Generated Code",
      desc: "GenWeb.ai constructs production-grade semantic trees. Clean code components, tailored modularity, and zero boilerplate generation.",
      icon: "⚡",
    },
    {
      title: "Fully Responsive Layouts",
      desc: "Flawless screen execution engineered into every block. Fluid responsive media breakpoints that natively snap into any resolution.",
      icon: "📱",
    },
    {
      title: "Production-ready Output",
      desc: "Scalable structure built directly for modern deployment. Clean code architecture, instant asset bundling, and fast performance metrics.",
      icon: "🚀",
    },
  ];

  const [openLogin, setOpenLogin] = useState(false);
  const { userData } = useSelector((state) => state.user);
  const [openProfile, setOpenProfile] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState(null);
  const profileRef = useRef(null);
  const handleLogOut = async () => {
    console.log("logoutclick");
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      setOpenProfile(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("session_id")) return;

    // Landed here from Stripe checkout. The webhook that actually credits
    // the account can take a moment to arrive, so re-fetch after a short
    // delay instead of trusting the credits loaded on initial page mount.
    const timer = setTimeout(async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/me`, {
          withCredentials: true,
        });
        dispatch(setUserData(result.data));
      } catch (error) {
        console.log(error);
      } finally {
        params.delete("session_id");
        const query = params.toString();
        navigate(`/${query ? `?${query}` : ""}`, { replace: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!userData) return;
    const handleGetAllWebsites = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/website/get-all`, {
          withCredentials: true,
        });
        setWebsites(result.data || []);
      } catch (error) {
        console.log(error);
      }
    };
    handleGetAllWebsites();
  }, [userData]);

  return (
    <div className="relative min-h-screen bg-[#040404] text-white overflow-hidden">
      {/* --- GOD LEVEL FLOATING NAVBAR --- */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
            delay: 0.1,
          }}
          className="w-full max-w-4xl backdrop-blur-xl bg-black/40 border border-white/10 rounded-full px-6 py-3 flex justify-between items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]"
        >
          <motion.div
            whileHover="hover"
            className="relative text-md font-bold tracking-wide cursor-pointer overflow-hidden group"
          >
            <motion.span
              variants={{ hover: { letterSpacing: "0.08em" } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-linear-to-r from-white via-purple-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] group-hover:bg-[100%_center] transition-all duration-500"
            >
              GenWeb.ai
            </motion.span>
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.div
              onClick={() => navigate("/pricing")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:inline text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors"
            >
              Pricing
            </motion.div>

            {userData && (
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm cursor-pointer hover:bg-white/10 transition"
                onClick={() => navigate("/pricing")}
              >
                <Coins size={14} className="text-yellow-400" />
                <span className="text-zinc-300">Credits</span>
                <span>{userData.credits}</span>
                <span className="font-semibold">+</span>
              </div>
            )}

            {!userData ? (
              <motion.button
                onClick={() => setOpenLogin(true)}
                whileHover={{
                  scale: 1.03,
                  borderColor: "rgba(168, 85, 247, 0.4)",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)",
                }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium tracking-wide shadow-sm transition-all duration-300"
              >
                Get Started
              </motion.button>
            ) : (
              <div className="relative" ref={profileRef}>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 16px rgba(168,85,247,0.35)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex items-center"
                  onClick={() => setOpenProfile(!openProfile)}
                >
                  <img
                    className="w-9 h-9 rounded-full border border-white/20 object-cover"
                    src={
                      userData.avatar ||
                      `https://ui-avatars.com/api/?name=${userData.name}`
                    }
                    alt=""
                  />
                </motion.button>

                <AnimatePresence>
                  {openProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                      className="absolute right-0 mt-3 w-64 z-50 rounded-2xl overflow-hidden"
                      style={{
                        background: "#0b0b0b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow:
                          "0 24px 60px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-[60px] pointer-events-none" />

                      <div className="relative px-4 pt-4 pb-3 border-b border-white/8">
                        <div className="flex items-center gap-3">
                          <img
                            className="w-10 h-10 rounded-full border border-purple-500/30 object-cover"
                            src={
                              userData.avatar ||
                              `https://ui-avatars.com/api/?name=${userData.name}`
                            }
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-white">
                              {userData.name}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                              {userData.email}
                            </p>
                          </div>
                        </div>

                        <div
                          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                          style={{
                            background: "rgba(234,179,8,0.08)",
                            border: "1px solid rgba(234,179,8,0.15)",
                          }}
                        >
                          <Coins size={13} className="text-yellow-400" />
                          <span className="text-zinc-300">
                            Credits remaining
                          </span>
                          <span className="ml-auto font-bold text-yellow-400">
                            {userData.credits}
                          </span>
                        </div>
                      </div>

                      <div className="p-2">
                        <motion.button
                          onClick={() => navigate("/dashboard")}
                          whileHover={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            x: 2,
                          }}
                          transition={{ duration: 0.15 }}
                          className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl text-sm text-zinc-300 hover:text-white transition-colors duration-150"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{
                              background: "rgba(139,92,246,0.15)",
                              border: "1px solid rgba(139,92,246,0.2)",
                            }}
                          >
                            <LayoutDashboard
                              size={13}
                              className="text-purple-400"
                            />
                          </div>
                          Dashboard
                        </motion.button>

                        <motion.button
                          onClick={handleLogOut}
                          whileHover={{
                            backgroundColor: "rgba(239,68,68,0.06)",
                            x: 2,
                          }}
                          transition={{ duration: 0.15 }}
                          className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl text-sm text-red-400 hover:text-red-300 transition-colors duration-150"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            <LogOut size={13} className="text-red-400" />
                          </div>
                          Logout
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="pt-48 pb-24 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.2,
          }}
          className="text-5xl md:text-7xl font-bold tracking-tight"
        >
          Build Stunning Websites <br />
          <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            with AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.3,
          }}
          className="mt-8 max-w-2xl mx-auto text-zinc-400 text-lg"
        >
          Describe your idea and let AI generate a modern, responsive,
          production-ready website.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.4,
          }}
          className="mt-10 relative inline-block group"
        >
          <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500 ease-out" />
          <motion.button
            onClick={() =>
              userData ? navigate("/dashboard") : setOpenLogin(true)
            }
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            className="relative px-8 py-3.5 rounded-full bg-linear-to-r from-purple-500 to-blue-500 font-semibold text-sm tracking-wide shadow-lg shadow-purple-500/20 transition-all duration-300 ease-out overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10">
              {userData ? "Go to Dashboard" : "Get Started"}
            </span>
          </motion.button>
        </motion.div>
      </section>

      {/* --- HIGHLIGHTS / CARDS SECTION --- */}
      {!userData && (
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 16,
                  delay: i * 0.1,
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
                }}
                className="relative rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 p-8 cursor-pointer transition-all duration-300 ease-out overflow-hidden group"
              >
                <div className="absolute inset-0 bg-radial from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="absolute inset-0 border border-purple-500/0 rounded-2xl group-hover:border-purple-500/30 transition-colors duration-500 pointer-events-none" />

                <motion.div
                  whileHover={{
                    scale: 1.1,
                    rotate: 5,
                  }}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl mb-6 shadow-inner transition-colors duration-300 group-hover:bg-purple-500/10 group-hover:border-purple-500/30"
                >
                  {item.icon}
                </motion.div>

                <h1 className="text-xl font-bold mb-3 tracking-tight group-hover:text-purple-300 transition-colors duration-300">
                  {item.title}
                </h1>

                <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {userData && websites?.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <h3 className="text-2xl font-semibold mb-6">Your Websites</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {websites.slice(0, 3).map((w, i) => (
              <motion.div
                key={w._id}
                whileHover={{ y: -6 }}
                onClick={() => navigate(`/editor/${w._id}`)}
                className="cursor-pointer rounded-2xl bg-white/5 border
            border-white/10 overflow-hidden"
              >
                <div className="h-40 bg-black">
                  <iframe
                    srcDoc={w.latestCode}
                    className="w-[140%] h-[140%] scale-[0.72] origin-top-left pointer-events-none bg-white"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-base font-semibold line-clamp-2">
                    {w.title}
                  </h3>
                  <p className="text-xs mt-2 text-zinc-400">
                    Last Updated {""}
                    {new Date(w.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-white/10 py-10 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} GenWeb.ai
      </footer>

      {openLogin && (
        <LoginModal open={openLogin} onClose={() => setOpenLogin(false)} />
      )}
    </div>
  );
}

export default Home;
