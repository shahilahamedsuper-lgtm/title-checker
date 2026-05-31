import { AnimatePresence } from "framer-motion";
import { useAIAssistant } from "../../context/AIAssistantContext";
import { AIAssistantButton } from "./AIAssistantButton";
import { AIAssistantPanel } from "./AIAssistantPanel";

export { AIAssistantButton } from "./AIAssistantButton";
export { AIAssistantPanel } from "./AIAssistantPanel";

/**
 * AIAssistantWidget
 *
 * Combines the floating action button and the chat panel into a single
 * component that can be dropped anywhere in the React tree. Both are
 * fixed-positioned so their placement in the JSX tree does not affect layout.
 */
export function AIAssistantWidget() {
  const { isOpen, togglePanel, messages } = useAIAssistant();

  return (
    <>
      <AIAssistantButton
        isOpen={isOpen}
        onClick={togglePanel}
        messageCount={messages.filter((m) => m.role !== "error").length}
      />
      <AnimatePresence>
        {isOpen && <AIAssistantPanel />}
      </AnimatePresence>
    </>
  );
}
