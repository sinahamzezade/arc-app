"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerFast } from "@/lib/motion/onboarding";
import { cn } from "@/lib/utils";

type MotionStaggerBaseProps = {
  children: React.ReactNode;
  className?: string;
  fast?: boolean;
};

type MotionStaggerDivProps = MotionStaggerBaseProps & {
  as?: "div" | "header" | "footer" | "ul";
};

type MotionStaggerFormProps = MotionStaggerBaseProps & {
  as: "form";
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
};

type MotionStaggerProps = MotionStaggerDivProps | MotionStaggerFormProps;

export function MotionStagger(props: MotionStaggerProps) {
  const { children, className, fast = false, as = "div" } = props;
  const variants = fast ? staggerFast : staggerContainer;

  if (as === "form") {
    const { onSubmit } = props as MotionStaggerFormProps;

    return (
      <motion.form
        className={cn(className)}
        variants={variants}
        onSubmit={onSubmit}
      >
        {children}
      </motion.form>
    );
  }

  const Component = motion[as];

  return (
    <Component className={cn(className)} variants={variants}>
      {children}
    </Component>
  );
}
