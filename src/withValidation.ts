import { type ZodObject, z } from "zod";

import { InferOrUndefined } from "./utils";

export interface WithValidationHandler<BodyType, ParamType, QueryType> {
  (options: {
    req: Request;
    body: BodyType;
    params: ParamType;
    query: QueryType;
  }): Promise<Response>;
}

export interface WithValidationOptions<BodyType, ParamType, QueryType> {
  body?: BodyType;
  params?: ParamType;
  query?: QueryType;
  options?: {
    messages?: {
      [key in "body" | "params" | "query"]?: string;
    };
  };
}

/**
 * A validation helper for Next.js route handlers
 * @param schemas An object of zod schemas
 * @param handler Your route handler
 * @returns
 *
 * @example
 * const bodySchema = z.object({ name: z.string() })
 * export const GET = withValidation({ body: bodySchema }, async({ req, body }) => {}) // body = { name: string }
 */
export function withValidation<
  BodyType extends ZodObject<any> | undefined,
  ParamType extends ZodObject<any> | undefined,
  QueryType extends ZodObject<any> | undefined,
>(
  schemas: WithValidationOptions<BodyType, ParamType, QueryType>,
  handler: WithValidationHandler<
    InferOrUndefined<BodyType>,
    InferOrUndefined<ParamType>,
    InferOrUndefined<QueryType>
  >,
) {
  return async (
    req: Request,
    params: ParamType extends ZodObject<any> ? z.infer<ParamType> : undefined,
  ): Promise<Response> => {
    let parsed: {
      body?: InferOrUndefined<BodyType>;
      params?: InferOrUndefined<ParamType>;
      query?: InferOrUndefined<QueryType>;
    } = {};

    if (schemas.body !== undefined) {
      try {
        const data = await req.json();
        const parsedBody = await schemas.body.safeParseAsync(data);

        if (!parsedBody.success) {
          return new Response(
            JSON.stringify({
              message: schemas.options?.messages?.body ?? "Bad Request",
            }),
            {
              status: 400,
            },
          );
        }

        parsed.body = parsedBody.data as InferOrUndefined<BodyType>;
      } catch (e) {
        if (e instanceof SyntaxError) {
          return new Response(
            JSON.stringify({ message: "Invalid JSON in body" }),
            { status: 400 },
          );
        }
        return new Response(
          JSON.stringify({
            message: schemas.options?.messages?.body ?? "Bad Request",
          }),
          {
            status: 400,
          },
        );
      }
    }
    if (schemas.params && params) {
      const parsedParams = await schemas.params.safeParseAsync(
        params["params"],
      );
      if (!parsedParams.success) {
        return new Response(
          JSON.stringify({
            message:
              schemas.options?.messages?.params ?? "Bad Request Parameters",
          }),
          { status: 400 },
        );
      }

      parsed.params = parsedParams.data as InferOrUndefined<ParamType>;
    }

    if (schemas.query) {
      const { searchParams } = new URL(req.url);
      const queryObject: { [key: string]: string } = {};
      searchParams.forEach((value, key) => {
        queryObject[key] = value;
      });

      const parsedQueries = await schemas.query.safeParseAsync(queryObject);

      if (!parsedQueries.success) {
        return new Response(
          JSON.stringify({
            message: schemas.options?.messages?.query ?? "Bad Request Query",
          }),
          {
            status: 400,
          },
        );
      }

      parsed.query = parsedQueries.data as InferOrUndefined<QueryType>;
    }

    return await handler({
      req,
      body: parsed.body as InferOrUndefined<BodyType>,
      params: parsed.params as InferOrUndefined<ParamType>,
      query: parsed.query as InferOrUndefined<QueryType>,
    });
  };
}
