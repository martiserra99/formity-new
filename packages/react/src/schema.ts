import type { ReactNode } from "react";
import type { Schema as SystemSchema, Values } from "@formity/system";

export type Schema<
  T extends Values,
  U extends object = Record<string, never>,
  V extends object = Record<string, never>
> = SystemSchema<ReactNode, T, U, V>;
