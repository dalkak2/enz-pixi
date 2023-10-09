/** @jsx jsx */
/** @jsxFrag Fragment */

import { Hono } from "https://deno.land/x/hono@v3.8.0-rc.2/mod.ts"
import { serveStatic, jsx, Fragment } from "https://deno.land/x/hono@v3.8.0-rc.2/middleware.ts"

import * as api from "./api/mod.ts"

const app = new Hono()

app.use("/static/*", serveStatic({root: "./"}))
app.get("/api/:name/:arg", async c => c.text(
    // @ts-ignore:
    await api[c.req.param("name")](c.req.param("arg"))
))
app.get("/p/:id", c => c.html(
    <div>
        {c.req.param("id")}
    </div>
))

Deno.serve(app.fetch)