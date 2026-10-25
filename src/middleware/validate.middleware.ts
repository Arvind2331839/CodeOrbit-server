import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestSchemas = Partial<Record<"body" | "params" | "query", ZodType>>;

export const validate = (schemas: RequestSchemas): RequestHandler => (req, _res, next) => {
  for (const key of Object.keys(schemas) as Array<keyof RequestSchemas>) {
    const schema = schemas[key];
    if (schema) {
      Object.defineProperty(req, key, {
        value: schema.parse(req[key]),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
  }
  next();
};