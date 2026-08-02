import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";
import { auth, provider } from "../firebase";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function LoginModal({ open, onClose }) {
  const dispatch = useDispatch();

  const handleGoogleAuth = async () => {
    try {
      console.log("Starting Google Login...");

      // Firebase Google Sign In
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      console.log("Firebase User:", user);

      // Send user data to backend
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google`,
        {
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL,
        },
        {
          withCredentials: true,
        },
      );

      console.log("Backend Response:", data);

      // Save user in Redux
      dispatch(setUserData(data));

      // Close modal
      onClose();

      // Reload page
      window.location.reload();
    } catch (error) {
      console.error("Google Login Error:", error);

      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Response:", error.response.data);
      } else if (error.request) {
        console.log("No response received:", error.request);
      } else {
        console.log("Error:", error.message);
      }

      alert(error.message);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.88, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative w-full max-w-md p-[1px] rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.5), rgba(99,102,241,0.3), rgba(59,130,246,0.4))",
            }}
          >
            <div className="relative rounded-3xl bg-[#0b0b0b] border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.8)] overflow-hidden">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 z-20 text-zinc-500 hover:text-white transition-colors duration-200"
              >
                ✕
              </button>

              <div className="relative px-8 pt-14 pb-10 text-center">
                <h1 className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
                  AI-powered website builder
                </h1>

                <h2 className="text-3xl font-semibold leading-tight mb-8">
                  <span className="text-white">Welcome to </span>
                  <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    GenWeb.ai
                  </span>
                </h2>

                <motion.button
                  onClick={handleGoogleAuth}
                  whileHover={{
                    scale: 1.03,
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                  }}
                  className="w-full rounded-xl font-semibold text-sm text-white h-[52px] flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"
                >
                  <img
                    src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
                    alt="google"
                    className="w-5 h-5 brightness-0 invert"
                  />
                  Continue
                </motion.button>

                <div className="flex items-center gap-4 my-8">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-zinc-500">Secure Login</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed">
                  By continuing, you agree to our Terms of Service and Privacy
                  Policy.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;
