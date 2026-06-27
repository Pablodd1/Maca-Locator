import React from "react";
import { motion } from "motion/react";

export function MacalocatorLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimensions = {
    sm: { box: "w-8 h-8", svg: "w-5 h-5", text: "text-lg" },
    md: { box: "w-10 h-10", svg: "w-6 h-6", text: "text-xl" },
    lg: { box: "w-16 h-16", svg: "w-10 h-10", text: "text-3xl" },
  };

  const current = dimensions[size];

  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.95 }}
        className={`${current.box} rounded-lg bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center cursor-pointer`}
      >
        <div className="w-full h-full flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={`${current.svg} text-blue-600`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Elegant Map Pin & Premium Car silhouette simplified */}
            <path 
              d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" 
              className="stroke-blue-600"
              strokeWidth="2"
            />
            <path 
              d="M9 9h6v3H9z" 
              className="stroke-emerald-600"
              strokeWidth="1.5"
            />
            <circle cx="10" cy="13" r="1" className="fill-blue-600 stroke-blue-600" />
            <circle cx="14" cy="13" r="1" className="fill-blue-600 stroke-blue-600" />
          </svg>
        </div>
      </motion.div>
      {size !== "lg" && (
        <span className={`${current.text} font-extrabold tracking-tight text-slate-800`}>
          MACA<span className="text-blue-600">LOCATOR</span>
        </span>
      )}
    </div>
  );
}

