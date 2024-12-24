import { Hono } from "hono";
import type { FC } from "hono/jsx";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
