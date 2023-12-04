import { Hono, Context } from "https://deno.land/x/hono@v3.8.0-rc.2/mod.ts"
import { etag } from "https://deno.land/x/hono@v3.8.0-rc.2/middleware.ts"

import { assert } from "https://deno.land/std@0.203.0/assert/mod.ts"

import {
    ensureFile,
    exists,
} from "https://deno.land/std@0.203.0/fs/mod.ts"

import * as api from "./api/mod.ts"

const app = new Hono()

import { transpile } from "https://deno.land/x/emit@0.25.0/mod.ts"

import { fromFileUrl } from "https://deno.land/std@0.208.0/path/windows/from_file_url.ts"

const scriptHandler = async (c: Context) => {
    const url = new URL(c.req.url)
    const target = new URL("." + url.pathname, import.meta.url)
    
    console.log("Transpile", url.pathname)
    let result
    if (await exists("deps/local" + url.pathname)) {
        const source = await Deno.stat("." + url.pathname)
        const target = await Deno.stat("deps/local" + url.pathname)

        if (
            // Deno Deploy인 경우 mtime 없으므로 무조건 캐시 사용
            // TODO: Env 읽는걸로 바꾸기
            !source.mtime ||
            !target.mtime ||
            source.mtime < target.mtime
        ) {
            console.log("Load from cache")
            result = await Deno.readTextFile("deps/local" + url.pathname)
        }
    }
    if (!result) {
        console.time(url.pathname)
        result = (await transpile(
            target,
            {
                cacheRoot: Deno.cwd(),
                load: async (specifier) => {
                    if (target.href == specifier) {
                        return {
                            kind: "module",
                            specifier,
                            content: await Deno.readTextFile("." + url.pathname),
                        }
                    } else {
                        return {
                            kind: "external",
                            specifier,
                        }
                    }
                },
            },
        )).get(target.href)
        console.timeEnd(url.pathname)
        assert(result)
        await ensureFile("deps/local" + url.pathname)
        Deno.writeTextFile("deps/local" + url.pathname, result)
    }

    c.header("content-type", "application/javascript; charset=utf-8")
    return c.body(
        result
        || `throw new Error("Transpile failed")`
    )
}

app.use("/*", etag({weak: true}))
app.get("/src/*", scriptHandler)
app.get("/deps/*", scriptHandler)

app.get("/image/lib/entry-js/images/*", async c => {
    const path = new URL(c.req.url).pathname
        .replace(/^\/image\//, "https://playentry.org/")
    return c.body(
        await fetch(path).then(x => x.body)
    )
})
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

export { app }