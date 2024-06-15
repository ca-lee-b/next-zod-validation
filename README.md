<p align="center">
  <h1 align="center">next-zod-validation</h1>
</p>

This package provides a helper function to automatically validate Zod schemas and provide typesafety in route handlers

## Installation

To install:

```sh
npm install next-zod-validation
```

## Usage

```ts
// app/api/[slug]/route.ts
import { withValidation } from 'next-zod-validation';
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string(),
});

const paramsSchema = z.object({
  slug: z.string().max(5),
});

const querySchema = z.object({
  limit: z.coerce.number(), // URL search params are strings by default
});

//POST http://localhost:3000/api/test?limit=10 (Body: "{"name": "john doe"}")
export const POST = withValidation(
  {
    body: bodySchema,
    params: paramsSchema,
    query: querySchema,
  },
  async ({ req, body, params, query }) => {
    const { name } = body;
    const { slug } = params;
    const { limit } = query;

    return NextResponse.json(body);
  },
);
```

## API

```ts
withValidation({
    body,   // (optional) Body schema
    params, // (optional) URL params schema
    query,   // (optional) Search params schema
    options?: {
        messages?: {
            body?: "Custom body error return message",
            params?: "Custom body params return message",
            query?: "Custom body query return message",
        }
    }
}, async ({ req, body params, query }) => {
    return new Response(JSON.stringfy({ message: "Hello!" }))
})
```

> Note: Validation (and subsequently error responses) first handles the `body`, then `params`, and then `query`.
> Another note: By default, URL search params are strings

## Contributing

All contributions are welcome! Please make an issue first for discussion.
