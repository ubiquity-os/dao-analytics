"use client";

import { useFormStatus } from "react-dom";
import { type ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  pendingText?: string;
};

export function SubmitButton({ children, pendingText, ...props }: Props) {
  const { pending: isPending2, action } = useFormStatus();

  const isPending = isPending2 && action === props.formAction;

  return (
    <button
      type="submit"
      formAction={props.formAction}
      aria-disabled={isPending}
      className="w-full align-middle items-center flex gap-1 cursor-pointer hover:bg-[#444]  hover:text-white text-[#999]"
    >
      {isPending ? pendingText : children}
    </button>
  );
}
