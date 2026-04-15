import { useEffect } from "react";
import { MdWarning, MdError } from "react-icons/md";

interface ToastMessageProps {
  message: string;
  type?: "warning" | "error";
  onDismiss: () => void;
}

export function ToastMessage({ message, type = "error", onDismiss }: ToastMessageProps) {
  useEffect(
    function autoDismiss() {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    },
    [onDismiss],
  );

  return (
    <div className="fixed right-4 bottom-24 left-4 z-50 mx-auto max-w-sm rounded-xl bg-gray-800 px-4 py-3 shadow-xl dark:bg-gray-700">
      <div className="flex items-start gap-3">
        {type === "warning" ? (
          <MdWarning className="mt-0.5 shrink-0 text-xl text-yellow-400" />
        ) : (
          <MdError className="mt-0.5 shrink-0 text-xl text-red-400" />
        )}
        <p className="text-sm leading-relaxed text-white">{message}</p>
      </div>
    </div>
  );
}
