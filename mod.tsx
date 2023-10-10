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

app.get("/image/lib/entry-js/images/media/:name", async c => c.body(
    await fetch(
        `https://playentry.org/lib/entry-js/images/media/${c.req.param("name")}`
    ).then(x => x.body)
))
app.get("/image/:id", async c => {
    const id = c.req.param("id")
    const [a,b,d,e] = id
    return c.body(
        await fetch(
            `https://playentry.org/uploads/${
                a + b
            }/${
                d + e
            }/image/${id}`
        ).then(x => x.body)
    )
})

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
            <style>
                app {
                    display: inline-block;
                }
            </style>
        </head>
        <body class="p(5) bg(#dee)">
            <app class="r(5) b(2) clip"/>

            <script type="module">
                import { Entry } from "/api/js/${c.req.param("id")}"
                await Entry.init(
                    document.querySelector("app")
                )
                Entry.start()
            </script>
            <script src="https://unpkg.com/adorable-css@1.4.3"></script>
        </body>
    </html>
`))

Deno.serve(app.fetch)