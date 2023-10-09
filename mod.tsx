/** @jsx jsx */
/** @jsxFrag Fragment */

import { Hono } from "https://deno.land/x/hono@v3.8.0-rc.2/mod.ts"
import { serveStatic, jsx, Fragment } from "https://deno.land/x/hono@v3.8.0-rc.2/middleware.ts"

import * as api from "./api/mod.ts"

const app = new Hono()

app.use("/static/*", serveStatic({root: "./"}))

import { transpile } from "https://deno.land/x/emit@0.25.0/mod.ts"

app.get("/src/*", async c => {
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
})

app.get("/api/project/:id", async c => c.json(
    await api.project(c.req.param("id"))
))
app.get("/api/js/:id", async c => {
    c.header("content-type", "application/javascript; charset=utf-8")
    return c.body(await api.js(c.req.param("id")))
})

app.get("/p/:id", c => c.html(
    <script type="module">
        import project from "/api/{c.req.param("id")}" with {`{ type: "json" }`}
        console.log(project)
    </script>
))

Deno.serve(app.fetch)