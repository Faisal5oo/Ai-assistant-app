"use client";

import { motion } from "framer-motion";
import { ChevronDown, Laptop, Wallet, Heart, PiggyBank } from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTaskStore } from "@/store/useTaskStore";

const ACCORDION = [
  { id: "pension", label: "Focus sessions", icon: PiggyBank },
  { id: "devices", label: "Active projects", icon: Laptop, expanded: true },
  { id: "comp", label: "Time this week", icon: Wallet },
  { id: "benefits", label: "Wellness goals", icon: Heart },
];

export function ProfileCard() {
  const [openId, setOpenId] = useState("devices");
  const userName = useTaskStore((s) => s.userName);
  const userAvatar = useTaskStore((s) => s.userAvatar);

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        layout
        className="glass-card relative overflow-hidden p-0"
      >
        <div className="relative aspect-[4/5] bg-gradient-to-br from-cream-200 via-gold-light/40 to-charcoal/10">
          <UserAvatar
            name={userName}
            avatar={userAvatar}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 25vw"
            fallbackClassName="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream-200 via-gold-light/40 to-charcoal/10 font-display text-5xl font-semibold text-charcoal/70"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 to-transparent p-5 pt-16">
          <div className="rounded-2xl border border-white/20 bg-white/20 p-4 backdrop-blur-md">
            <p className="font-display text-lg font-semibold text-white">
              {userName || "Your workspace"}
            </p>
            <p className="text-sm text-white/70">Productivity hub</p>
            <span className="mt-2 inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-charcoal">
              Pro Plan
            </span>
          </div>
        </div>
      </motion.div>

      <div className="glass-card divide-y divide-charcoal/5 overflow-hidden p-2">
        {ACCORDION.map(({ id, label, icon: Icon }) => {
          const open = openId === id;
          return (
            <div key={id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} className="text-charcoal/50" />
                  {label}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && id === "devices" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="flex items-center gap-3 px-4 pb-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal/5">
                    <Laptop size={24} className="text-charcoal/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Main project</p>
                    <p className="text-xs text-charcoal/50">TaskFlow dashboard</p>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
