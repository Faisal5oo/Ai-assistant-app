"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTaskStore } from "@/store/useTaskStore";

/* ─── Motion tokens (Apple-inspired easing) ─── */
const EASE_LUXE = [0.22, 1, 0.36, 1];
const EASE_APPLE = [0.32, 0.72, 0, 1];
const SPRING_CARD = { type: "spring", stiffness: 380, damping: 34, mass: 0.85 };
const SPRING_GLIDE = { type: "spring", stiffness: 420, damping: 38, mass: 0.75 };
const MORPH_TWEEN = { type: "tween", ease: EASE_APPLE, duration: 0.42 };
const GOLD_MUTED = "#B8956B";

const FIELD_CROSSFADE = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(3px)" },
};

const CARD_ENTRANCE = {
  initial: { opacity: 0, scale: 0.965, y: 18, filter: "blur(10px)" },
  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
};

const CARD_SHAKE = {
  x: [0, -14, 14, -10, 10, -5, 5, 0],
  transition: { duration: 0.52, ease: "easeInOut" },
};

const STAGGER_CHILD = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 + i * 0.07,
      duration: 0.5,
      ease: EASE_LUXE,
    },
  }),
};

const TITLE_WORDS = ["Enter", "The", "Flow."];

/* ─── Ambient canvas ─── */
function AmbientCanvas({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#F9F6F0]">
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={false}
        animate={
          reduceMotion
            ? {
                background:
                  "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(184, 149, 107, 0.14) 0%, transparent 62%)",
              }
            : {
                background: [
                  "radial-gradient(ellipse 72% 58% at 28% 38%, rgba(184, 149, 107, 0.16) 0%, transparent 58%)",
                  "radial-gradient(ellipse 68% 52% at 72% 62%, rgba(184, 149, 107, 0.18) 0%, transparent 56%)",
                  "radial-gradient(ellipse 74% 60% at 48% 28%, rgba(184, 149, 107, 0.14) 0%, transparent 60%)",
                  "radial-gradient(ellipse 72% 58% at 28% 38%, rgba(184, 149, 107, 0.16) 0%, transparent 58%)",
                ],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 22, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <div
        aria-hidden
        className="auth-editorial-grain absolute inset-0"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[#F9F6F0]/80"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/**
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} props.type
 * @param {string} props.value
 * @param {(v: string) => void} props.onChange
 * @param {string} [props.autoComplete]
 */
function FloatingField({ id, label, type, value, onChange, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <motion.div
      layout
      transition={SPRING_GLIDE}
      className="relative pt-5 sm:pt-6"
    >
      <motion.label
        htmlFor={id}
        animate={{
          y: active ? -24 : 0,
          scale: active ? 0.8 : 1,
          color: active ? GOLD_MUTED : "rgba(26, 26, 26, 0.42)",
        }}
        transition={SPRING_GLIDE}
        className="pointer-events-none absolute left-0 origin-left font-display text-[12px] tracking-[0.14em] sm:text-[13px]"
      >
        {label}
      </motion.label>
      <motion.input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        animate={{
          scale: focused ? 1.005 : 1,
        }}
        transition={SPRING_GLIDE}
        className="auth-field-input w-full rounded-xl border-0 bg-charcoal/[0.03] px-4 pb-2.5 pt-3.5 font-sans text-[15px] tracking-wide text-charcoal outline-none ring-0 transition-[box-shadow,background-color] duration-300 focus:bg-white/60 focus:shadow-[inset_0_0_0_1px_rgba(184,149,107,0.35)] sm:pb-3 sm:pt-4"
      />
    </motion.div>
  );
}

/**
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} props.value
 * @param {(v: string) => void} props.onChange
 * @param {string} [props.autoComplete]
 */
function PasswordFloatingField({ id, label, value, onChange, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const active = focused || value.length > 0;

  return (
    <motion.div
      layout
      transition={SPRING_GLIDE}
      className="relative pt-5 sm:pt-6"
    >
      <motion.label
        htmlFor={id}
        animate={{
          y: active ? -24 : 0,
          scale: active ? 0.8 : 1,
          color: active ? GOLD_MUTED : "rgba(26, 26, 26, 0.42)",
        }}
        transition={SPRING_GLIDE}
        className="pointer-events-none absolute left-0 origin-left font-display text-[12px] tracking-[0.14em] sm:text-[13px]"
      >
        {label}
      </motion.label>
      <motion.input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        animate={{ scale: focused ? 1.005 : 1 }}
        transition={SPRING_GLIDE}
        className="auth-field-input w-full rounded-xl border-0 bg-charcoal/[0.03] px-4 pb-2.5 pt-3.5 pr-12 font-sans text-[15px] tracking-wide text-charcoal outline-none ring-0 transition-[box-shadow,background-color] duration-300 focus:bg-white/60 focus:shadow-[inset_0_0_0_1px_rgba(184,149,107,0.35)] sm:pb-3 sm:pt-4"
      />
      <motion.button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        whileTap={{ scale: 0.9 }}
        transition={SPRING_GLIDE}
        className="absolute bottom-2.5 right-3 flex h-9 w-9 items-center justify-center rounded-xl text-charcoal/40 transition-colors hover:bg-charcoal/[0.04] hover:text-charcoal/65 sm:bottom-3"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={visible ? "hide" : "show"}
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 8 }}
            transition={{ duration: 0.22, ease: EASE_APPLE }}
            className="flex items-center justify-center"
          >
            {visible ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

/**
 * @param {{ type: "error" | "success", message: string } | null} toast
 * @param {() => void} onDismiss
 */
function AuthToast({ toast, onDismiss }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={`${toast.type}-${toast.message}`}
          role="alert"
          initial={{ opacity: 0, y: -10, scale: 0.97, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
          transition={{ duration: 0.45, ease: EASE_APPLE }}
          className={`flex items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_8px_32px_rgba(26,26,26,0.08)] backdrop-blur-xl ${
            toast.type === "error"
              ? "border-charcoal/[0.06] bg-white/80"
              : "border-emerald-200/60 bg-emerald-50/85"
          }`}
        >
          {toast.type === "error" ? (
            <ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber-800/70" strokeWidth={1.75} />
          ) : (
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={1.75} />
          )}
          <p className="flex-1 text-[13px] leading-relaxed tracking-wide text-charcoal/75">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-charcoal/30 transition hover:text-charcoal/55"
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * State 1 — monastic entry (no forms)
 * @param {Object} props
 * @param {() => void} props.onIgnite
 * @param {boolean} props.reduceMotion
 */
function MonasticLanding({ onIgnite, reduceMotion }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      key="landing"
      className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center"
      exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
      transition={{ duration: 0.48, ease: EASE_APPLE }}
    >
      <motion.div
        layoutId="flow-shield"
        className="relative mb-10 flex h-[88px] w-[88px] items-center justify-center rounded-[1.75rem] border border-charcoal/[0.04] bg-white/40 shadow-[0_8px_40px_rgba(26,26,26,0.06)] backdrop-blur-md"
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-[1.75rem] bg-charcoal/[0.04] blur-xl"
        />
        <ShieldCheck
          size={40}
          strokeWidth={1.25}
          className="relative text-charcoal/75"
        />
      </motion.div>

      <motion.h1
        layoutId="flow-title"
        className="font-display text-[clamp(2.25rem,6vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-charcoal"
      >
        <span className="flex flex-wrap justify-center gap-x-[0.28em] gap-y-1">
          {TITLE_WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
              animate={
                ready
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: 0, y: 28, filter: "blur(8px)" }
              }
              transition={{
                delay: 0.15 + i * 0.12,
                duration: 0.65,
                ease: EASE_LUXE,
              }}
              className="inline-block"
            >
              {word}
            </motion.span>
          ))}
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.55, ease: EASE_LUXE }}
        className="mt-5 max-w-sm text-[13px] font-medium uppercase tracking-[0.22em] text-charcoal/40"
      >
        A monastic gateway to deep work
      </motion.p>

      <motion.button
        type="button"
        onClick={onIgnite}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.72, duration: 0.5, ease: EASE_LUXE }}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        className="group relative mt-14 overflow-hidden rounded-full border border-charcoal/[0.08] bg-charcoal px-12 py-4 font-display text-[12px] font-semibold uppercase tracking-[0.28em] text-white shadow-[0_12px_40px_rgba(26,26,26,0.18)]"
      >
        <span className="relative z-10 flex items-center gap-2.5">
          <Sparkles size={14} className="opacity-70" strokeWidth={1.75} />
          Ignite
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 auth-ignite-glow"
        />
      </motion.button>
    </motion.div>
  );
}

/**
 * State 2 — adaptive auth canvas
 */
function AuthMorphCanvas({
  isSignUp,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  toast,
  setToast,
  shakeCard,
  formLoading,
  googleLoading,
  onGoogleClick,
  onSubmit,
  reduceMotion,
  googleHiddenRef,
  signupCelebrating,
  onToggleMode,
}) {
  return (
    <motion.div
      key="auth-canvas"
      layout
      initial={reduceMotion ? { opacity: 0 } : CARD_ENTRANCE.initial}
      animate={
        signupCelebrating && !reduceMotion
          ? { ...CARD_ENTRANCE.animate, scale: 1.02 }
          : shakeCard && !reduceMotion
            ? { ...CARD_ENTRANCE.animate, ...CARD_SHAKE }
            : CARD_ENTRANCE.animate
      }
      transition={SPRING_CARD}
      className="auth-card auth-card-compact relative z-10 w-full max-w-[440px] overflow-hidden rounded-[1.75rem] border border-black/[0.04] bg-white/60 p-5 shadow-[0_4px_60px_rgba(26,26,26,0.06),0_1px_0_rgba(255,255,255,0.85)_inset] backdrop-blur-2xl sm:rounded-[2rem] sm:p-7 lg:p-9"
    >
      <AnimatePresence>
        {signupCelebrating && (
          <motion.div
            key="signup-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_APPLE }}
            className="absolute inset-0 z-30 flex items-center justify-center rounded-[inherit] bg-white/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={SPRING_CARD}
              className="flex flex-col items-center gap-3 px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...SPRING_CARD, delay: 0.08 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"
              >
                <CheckCircle2 size={34} className="text-emerald-600" strokeWidth={1.5} />
              </motion.div>
              <p className="font-display text-xl font-semibold tracking-tight text-charcoal">
                You&apos;re in
              </p>
              <p className="text-[13px] tracking-wide text-charcoal/50">
                Preparing your workspace…
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-5 top-4 z-20 sm:inset-x-7">
        <div className="pointer-events-auto">
          <AuthToast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      </div>

      <motion.header
        layout
        transition={SPRING_GLIDE}
        className="auth-card-header mb-6 text-center sm:mb-7"
      >
        <motion.div
          layoutId="flow-shield"
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-charcoal/[0.05] bg-white/50 shadow-[0_4px_24px_rgba(26,26,26,0.05)]"
        >
          <ShieldCheck size={26} strokeWidth={1.35} className="text-charcoal/70" />
        </motion.div>

        <motion.p
          layout
          className="font-display text-[10px] font-medium uppercase tracking-[0.32em] text-charcoal/38"
        >
          TaskFlow · Monastic
        </motion.p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isSignUp ? "signup-copy" : "signin-copy"}
            layout
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: { opacity: 0 },
              animate: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.02 },
              },
              exit: {
                opacity: 0,
                transition: { duration: 0.2, ease: EASE_APPLE },
              },
            }}
          >
            <motion.h1
              layoutId="flow-title"
              variants={FIELD_CROSSFADE}
              transition={MORPH_TWEEN}
              className="mt-3 font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-charcoal sm:text-[1.65rem]"
            >
              {isSignUp ? "Claim your space" : "Return to flow"}
            </motion.h1>
            <motion.p
              variants={FIELD_CROSSFADE}
              transition={{ ...MORPH_TWEEN, delay: 0.05 }}
              className="mt-1.5 text-[12px] tracking-[0.06em] text-charcoal/48 sm:mt-2 sm:text-[13px]"
            >
              {isSignUp
                ? "One threshold between noise and clarity."
                : "Resume where your focus left off."}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </motion.header>

      <motion.div
        custom={0}
        variants={STAGGER_CHILD}
        initial="hidden"
        animate="show"
        layout
        transition={SPRING_GLIDE}
      >
        <div
          ref={googleHiddenRef}
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
          aria-hidden
        />

        <motion.button
          type="button"
          layout
          onClick={onGoogleClick}
          disabled={googleLoading}
          whileHover={reduceMotion ? undefined : { scale: 1.008, y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.985, y: 0 }}
          transition={SPRING_GLIDE}
          className="auth-google-shimmer group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-black/[0.05] bg-white px-5 py-3.5 text-[14px] font-medium tracking-[0.04em] text-charcoal shadow-[0_2px_16px_rgba(26,26,26,0.06)] transition-shadow duration-500 hover:shadow-[0_8px_32px_rgba(26,26,26,0.09)] disabled:opacity-65 sm:py-4 sm:text-[15px]"
        >
          {googleLoading ? (
            <Loader2 size={20} className="animate-spin text-charcoal/45" />
          ) : (
            <GoogleIcon />
          )}
          <span>{googleLoading ? "Authenticating…" : "Continue with Google"}</span>
        </motion.button>
      </motion.div>

      <motion.div
        custom={1}
        variants={STAGGER_CHILD}
        initial="hidden"
        animate="show"
        layout
        className="auth-card-divider my-5 flex items-center gap-4 sm:my-6"
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-charcoal/[0.08] to-transparent" />
        <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-charcoal/32">
          or continue
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-charcoal/[0.08] to-transparent" />
      </motion.div>

      <form onSubmit={onSubmit}>
        <motion.div layout transition={SPRING_GLIDE} className="space-y-0.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {isSignUp && (
              <motion.div
                key="field-name"
                layout
                variants={FIELD_CROSSFADE}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={MORPH_TWEEN}
                className="mb-1 sm:mb-2"
              >
                <FloatingField
                  id="auth-name"
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout transition={SPRING_GLIDE} className="space-y-2 sm:space-y-3">
            <FloatingField
              id="auth-email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <PasswordFloatingField
              id="auth-password"
              label={isSignUp ? "Create password" : "Password"}
              value={password}
              onChange={setPassword}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </motion.div>
        </motion.div>

        <motion.button
          type="submit"
          layout
          custom={2}
          variants={STAGGER_CHILD}
          initial="hidden"
          animate="show"
          disabled={formLoading}
          whileHover={reduceMotion ? undefined : { scale: 1.008 }}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          transition={SPRING_GLIDE}
          className="auth-submit-shimmer relative mt-6 w-full overflow-hidden rounded-2xl bg-charcoal py-3.5 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-70 sm:mt-7 sm:py-4 sm:text-[12px]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {formLoading && <Loader2 size={15} className="animate-spin opacity-80" />}
            {formLoading
              ? isSignUp
                ? "Forging account…"
                : "Entering…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </span>
        </motion.button>
      </form>

      <motion.p
        layout
        transition={SPRING_GLIDE}
        className="auth-card-footer mt-6 text-center text-[12px] tracking-[0.05em] text-charcoal/45 sm:mt-7 sm:text-[13px]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isSignUp ? "toggle-signin" : "toggle-signup"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.32, ease: EASE_APPLE }}
          >
            {isSignUp ? "Already in the sanctuary?" : "First crossing?"}{" "}
          </motion.span>
        </AnimatePresence>
        <motion.button
          type="button"
          layout
          onClick={onToggleMode}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={SPRING_GLIDE}
          className="font-medium text-charcoal underline decoration-charcoal/15 underline-offset-[5px] transition-colors duration-300 hover:decoration-charcoal/45"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </motion.button>
      </motion.p>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function AuthPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const googleHiddenRef = useRef(null);
  const gsiReadyRef = useRef(false);
  const googleTimeoutRef = useRef(null);

  const [entered, setEntered] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [shakeCard, setShakeCard] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false);
  const [signupCelebrating, setSignupCelebrating] = useState(false);

  const setUserProfile = useTaskStore((s) => s.setUserProfile);
  const queryClient = useQueryClient();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const showError = useCallback((message) => {
    setToast({ type: "error", message });
    setShakeCard(true);
  }, []);

  const showSuccess = useCallback((message) => {
    setToast({ type: "success", message });
  }, []);

  useEffect(() => {
    if (!shakeCard) return undefined;
    const t = setTimeout(() => setShakeCard(false), 520);
    return () => clearTimeout(t);
  }, [shakeCard]);

  useEffect(() => {
    document.documentElement.classList.add("auth-page-scroll");
    return () => {
      document.documentElement.classList.remove("auth-page-scroll");
    };
  }, []);

  const handleGoogleCredential = useCallback(
    async (credential) => {
      if (!credential) {
        showError("Google sign-in was cancelled or incomplete.");
        setGoogleLoading(false);
        return;
      }

      setGoogleLoading(true);
      setToast(null);

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          showError(data.error || "Authentication failed. Please try again.");
          setGoogleLoading(false);
          return;
        }

        queryClient.removeQueries();
        if (data.user) {
          setUserProfile({
            name: data.user.name,
            avatar: data.user.avatar || "",
          });
        }

        showSuccess("Welcome. Crossing into your workspace…");
        router.push("/dashboard");
      } catch {
        showError("Network error. Please check your connection.");
        setGoogleLoading(false);
      }
    },
    [router, queryClient, setUserProfile, showError, showSuccess]
  );

  const initGoogleIdentity = useCallback(() => {
    if (!clientId || !window.google?.accounts?.id || gsiReadyRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => handleGoogleCredential(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (googleHiddenRef.current) {
      window.google.accounts.id.renderButton(googleHiddenRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 360,
      });
    }

    gsiReadyRef.current = true;
  }, [clientId, handleGoogleCredential]);

  useEffect(() => {
    if (gsiScriptLoaded) initGoogleIdentity();
  }, [gsiScriptLoaded, initGoogleIdentity]);

  useEffect(() => {
    if (!googleLoading) {
      if (googleTimeoutRef.current) {
        clearTimeout(googleTimeoutRef.current);
        googleTimeoutRef.current = null;
      }
      return undefined;
    }

    googleTimeoutRef.current = setTimeout(() => setGoogleLoading(false), 45000);
    return () => {
      if (googleTimeoutRef.current) {
        clearTimeout(googleTimeoutRef.current);
        googleTimeoutRef.current = null;
      }
    };
  }, [googleLoading]);

  const triggerGoogleSignIn = () => {
    if (!clientId) {
      showError("Google sign-in is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID).");
      return;
    }
    if (!window.google?.accounts?.id) {
      showError("Google Identity is still loading. Try again shortly.");
      return;
    }

    setGoogleLoading(true);
    setToast(null);

    const hiddenBtn = googleHiddenRef.current?.querySelector('div[role="button"]');
    if (hiddenBtn) {
      hiddenBtn.click();
      return;
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        showError("Google sign-in could not be shown. Check popup blockers.");
        setGoogleLoading(false);
      }
    });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setToast(null);
    setSignupCelebrating(false);

    const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignUp
      ? { name: name.trim(), email: email.trim(), password }
      : { email: email.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        showError(
          data.error ||
            (isSignUp ? "Sign up could not be completed." : "Sign in failed. Verify your credentials.")
        );
        setFormLoading(false);
        return;
      }

      queryClient.removeQueries();
      if (data.user) {
        setUserProfile({
          name: data.user.name,
          avatar: data.user.avatar || "",
        });
      }

      if (isSignUp) {
        setFormLoading(false);
        setSignupCelebrating(true);
        window.setTimeout(() => router.push("/dashboard"), 1200);
        return;
      }

      showSuccess("Welcome back. Entering sanctuary…");
      window.setTimeout(() => router.push("/dashboard"), 650);
    } catch {
      showError("Something went wrong. Please try again.");
      setFormLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiScriptLoaded(true)}
      />

      <div className="auth-page-shell">
        <div className="pointer-events-none fixed inset-0 z-0">
          <AmbientCanvas reduceMotion={!!reduceMotion} />
        </div>

        <div className="auth-page-content relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          <LayoutGroup id="auth-flow">
            <AnimatePresence mode="popLayout" initial={false}>
              {!entered ? (
                <MonasticLanding
                  key="landing"
                  onIgnite={() => setEntered(true)}
                  reduceMotion={!!reduceMotion}
                />
              ) : (
                <AuthMorphCanvas
                  key="auth"
                isSignUp={isSignUp}
                name={name}
                  setName={setName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  toast={toast}
                  setToast={setToast}
                  shakeCard={shakeCard}
                  formLoading={formLoading}
                  googleLoading={googleLoading}
                  onGoogleClick={triggerGoogleSignIn}
                  onSubmit={handleEmailSubmit}
                  reduceMotion={!!reduceMotion}
                  googleHiddenRef={googleHiddenRef}
                  signupCelebrating={signupCelebrating}
                  onToggleMode={() => {
                    setIsSignUp((v) => !v);
                    setToast(null);
                    setPassword("");
                    setSignupCelebrating(false);
                  }}
                />
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </>
  );
}
