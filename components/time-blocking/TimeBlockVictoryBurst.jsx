"use client";



import { motion } from "framer-motion";



const PARTICLES = Array.from({ length: 16 }, (_, i) => ({

  id: i,

  angle: (i / 16) * Math.PI * 2 + 0.15,

  distance: 32 + (i % 5) * 10,

}));



/**

 * Dark-and-gold runway completion celebration.

 * @param {Object} props

 * @param {boolean} props.active

 */

export function TimeBlockVictoryBurst({ active }) {

  if (!active) return null;



  return (

    <motion.div

      className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-2xl"

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

      exit={{ opacity: 0 }}

      aria-hidden

    >

      <motion.div

        className="absolute inset-0 bg-gradient-to-br from-charcoal/85 via-[#1a1814]/75 to-charcoal/90"

        initial={{ opacity: 0 }}

        animate={{ opacity: [0, 0.92, 0.35] }}

        transition={{ duration: 0.75, ease: "easeOut" }}

      />

      <motion.div

        className="absolute inset-0 bg-gradient-to-tr from-gold/40 via-amber-300/25 to-transparent"

        initial={{ opacity: 0 }}

        animate={{ opacity: [0, 1, 0.25] }}

        transition={{ duration: 0.8, ease: "easeOut" }}

      />

      <motion.div

        className="absolute inset-[-35%] rounded-full bg-gold/20 blur-3xl"

        initial={{ scale: 0.2, opacity: 0 }}

        animate={{ scale: 1.8, opacity: [0, 0.9, 0] }}

        transition={{ duration: 0.85, ease: "easeOut" }}

      />

      <motion.div

        className="absolute inset-0"

        initial={{ opacity: 0 }}

        animate={{ opacity: [0, 1, 0] }}

        transition={{ duration: 0.9, ease: "easeOut" }}

        style={{

          background:

            "linear-gradient(105deg, transparent 15%, rgba(250,204,21,0.65) 48%, rgba(251,191,36,0.35) 52%, transparent 85%)",

          backgroundSize: "220% 100%",

        }}

      />

      {PARTICLES.map((p) => (

        <motion.span

          key={p.id}

          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_6px_rgba(250,204,21,0.8)]"

          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}

          animate={{

            x: Math.cos(p.angle) * p.distance,

            y: Math.sin(p.angle) * p.distance,

            scale: [0, 1.6, 0],

            opacity: [1, 1, 0],

          }}

          transition={{

            duration: 0.7,

            ease: [0.22, 1, 0.36, 1],

            delay: p.id * 0.016,

          }}

        />

      ))}

      <motion.svg

        className="absolute inset-0 h-full w-full"

        viewBox="0 0 100 100"

        preserveAspectRatio="none"

        initial={{ opacity: 0 }}

        animate={{ opacity: [0, 1, 0] }}

        transition={{ duration: 0.85 }}

      >

        <motion.path

          d="M 6 50 Q 50 6 94 50 Q 50 94 6 50"

          fill="none"

          stroke="rgba(250,204,21,0.85)"

          strokeWidth="1.8"

          initial={{ pathLength: 0 }}

          animate={{ pathLength: 1 }}

          transition={{ duration: 0.6, ease: "easeOut" }}

        />

        <motion.path

          d="M 20 50 L 80 50"

          fill="none"

          stroke="rgba(255,255,255,0.25)"

          strokeWidth="0.8"

          initial={{ pathLength: 0 }}

          animate={{ pathLength: 1 }}

          transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}

        />

      </motion.svg>

    </motion.div>

  );

}


