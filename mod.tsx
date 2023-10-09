/** @jsx jsx */
/** @jsxFrag Fragment */

import { Hono, Context } from "https://deno.land/x/hono@v3.8.0-rc.2/mod.ts"
import { serveStatic, jsx, Fragment } from "https://deno.land/x/hono@v3.8.0-rc.2/middleware.ts"

import * as api from "./api/mod.ts"

const app = new Hono()

import { transpile } from "https://deno.land/x/emit@0.25.0/mod.ts"

const scriptHandler = async (c: Context) => {
    const url = new URL(c.req.url)
    const target = new URL("." + url.pathname, import.meta.url)
    const result = await transpile(
        target,
        { cacheRoot: Deno.cwd() },
    )

    c.header("content-type", "application/javascript; charset=utf-8")
    return c.body(
        result.get(target.href)
        || `throw new Error("Transpile failed")`
    )
}

app.get("/src/*", scriptHandler)
app.get("/deps/*", scriptHandler)

app.get("/api/project/:id", async c => c.json(
    await api.project(c.req.param("id"))
))
app.get("/api/js/:id", async c => {
    c.header("content-type", "application/javascript; charset=utf-8")
    return c.body(await api.js(c.req.param("id")))
})

app.get("/p/:id", c => c.html(`
    <!doctype html>
    <html>
        <head>
        </head>
        <body>
            <script
                type="module"
                src="/api/js/${c.req.param("id")}"
            ></script>
        </body>
    </html>
`))

Deno.serve(app.fetch)