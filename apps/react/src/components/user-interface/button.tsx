import type { ReactNode } from "react";

import { cn } from "../../utils";

interface ButtonProps {
  type?: "button" | "submit";
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  cy?: string;
}

export default function Button({
  type = "submit",
  children,
  disabled,
  onClick,
  cy,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "block w-full rounded-full bg-indigo-500 px-6 py-4 text-base text-white hover:bg-indigo-400",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black",
        "disabled:bg-indigo-500 disabled:opacity-60"
      )}
      disabled={disabled}
      onClick={onClick}
      data-cy={cy}
    >
      {children}
    </button>
  );
}
