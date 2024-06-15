import { type ZodObject, z } from "zod";

export type InferOrUndefined<T> =
  T extends ZodObject<any> ? z.infer<T> : undefined;
