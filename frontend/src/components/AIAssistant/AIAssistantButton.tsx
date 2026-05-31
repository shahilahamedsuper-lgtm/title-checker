import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";

interface AIAssistantButtonProps {
  isOpen: boolean;
  onClick: () => void;
  messageCount: number;
}

export function AIAssistantButton({ isOpen, onClick, messageCount }: AIAssistantButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
      {/* Animated pulse rings — visible only when panel is closed */}
      {!isOpen && (
        <>
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: "rgba(168,85,247,0.25)",
              animationDuration: "2s",
            }}
            aria-hidden="true"
          />
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: "rgba(99,102,241,0.15)",
              animationDuration: "2s",
              animationDelay: "0.5s",
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Main FAB */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #0891b2 100%)",
          boxShadow: isOpen
            ? "0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(59,130,246,0.2)"
            : "0 0 24px rgba(168,85,247,0.6), 0 0 48px rgba(59,130,246,0.3), 0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        {/* Holographic shimmer overlay */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Icon — Bot when closed, X when open */}
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Bot className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {!isOpen && messageCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              style={{ boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
              aria-label={`${messageCount} unread messages`}
            >
              {messageCount > 9 ? "9+" : messageCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
