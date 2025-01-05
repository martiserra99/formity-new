import { useFormContext } from "react-hook-form";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

import { useController } from "../../controller";
import { cn } from "../../utils";

export default function Back() {
  const { getValues } = useFormContext();
  const { onBack } = useController();
  return (
    <button
      data-cy="back"
      type="button"
      onClick={() => onBack(getValues())}
      className={cn(
        "block rounded-full border border-neutral-800 bg-neutral-950 px-6 py-2 hover:bg-neutral-800",
        "focus:outline-none focus:ring-2 focus:ring-white/10 focus:ring-offset-2 focus:ring-offset-black",
        "disabled:bg-neutral-950 disabled:opacity-60"
      )}
    >
      <ChevronLeftIcon className="pointer-events-none size-5 fill-white" />
    </button>
  );
}
