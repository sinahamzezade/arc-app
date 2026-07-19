"use client";

import {
  ButtonRoot,
  BUTTON_GROUP_CHILD,
  buttonVariants,
  type ButtonRootProps,
} from "@heroui/react/button";
import { Spinner } from "@heroui/react/spinner";
import type { ReactNode } from "react";

export type { ButtonRootProps, ButtonRootProps as ButtonProps } from "@heroui/react/button";
export type { ButtonVariants } from "@heroui/styles";
export { ButtonRoot, BUTTON_GROUP_CHILD, buttonVariants };

type ArcButtonProps = ButtonRootProps & {
  /** Replaces children while pending. Defaults to keeping the label. */
  pendingLabel?: ReactNode;
};

/**
 * HeroUI Button with automatic pending spinner.
 * Pass `isPending` — spinner appears, interactions disable (RAC).
 * Custom render-prop children still work as HeroUI docs show.
 */
function ButtonRootWithPending({
  children,
  isPending,
  pendingLabel,
  ...props
}: ArcButtonProps) {
  if (typeof children === "function") {
    return (
      <ButtonRoot isPending={isPending} {...props}>
        {children}
      </ButtonRoot>
    );
  }

  return (
    <ButtonRoot isPending={isPending} {...props}>
      {({ isPending: pending }) => (
        <>
          {pending ? <Spinner color="current" size="sm" aria-hidden /> : null}
          {pending && pendingLabel != null ? pendingLabel : children}
        </>
      )}
    </ButtonRoot>
  );
}

export const Button = Object.assign(ButtonRootWithPending, {
  Root: ButtonRootWithPending,
});
