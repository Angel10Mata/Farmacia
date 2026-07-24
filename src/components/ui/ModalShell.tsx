import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function ModalShell({ isOpen, onClose, title, description, className, children }: ModalShellProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn("bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-xl w-full max-w-md", className)}
          >
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">{title}</h3>
                {description && <p className="text-xs text-zinc-500">{description}</p>}
              </div>
              <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
