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

import {
    parseProject,
    Project,
} from "./deps/enz.ts"

import "https://deno.land/std@0.210.0/dotenv/load.ts"

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

app.use("/src/*", etag({weak: true}))
app.get("/src/*", scriptHandler)

app.use("/deps/*", etag({weak: true}))
app.get("/deps/*", scriptHandler)


// /image/lib/entryjs/images/
// /image/lib/entry-js/images/
app.get("/image/lib/*/images/*", async c => {
    const path = new URL(c.req.url).pathname
        .replace(/^\/image\//, "https://playentry.org/")
    return c.body(
        await api.image(path),
        {
            headers: {
                "cache-control": "max-age=31536000, public, immutable"
            }
        },
    )
})
app.get("/image/:id", async c => {
    const id = c.req.param("id")
    const [a,b,d,e] = id
    return c.body(
        await api.image(
            `https://playentry.org/uploads/${
                a + b
            }/${
                d + e
            }/image/${id}`
        ),
        {
            headers: {
                "cache-control": "max-age=31536000, public, immutable"
            }
        },
    )
})
app.get("/sound/lib/entry-js/images/*", async c => {
    const path = new URL(c.req.url).pathname
        .replace(/^\/sound\//, "https://playentry.org/")
    return c.body(
        await api.image(path),
        {
            headers: {
                "cache-control": "max-age=31536000, public, immutable"
            }
        },
    )
})
app.get("/sound/:id", async c => {
    const id = c.req.param("id")
    const [a,b,d,e] = id
    return c.body(
        await api.image(
            `https://playentry.org/uploads/${
                a + b
            }/${
                d + e
            }/${id}`
        ),
        {
            headers: {
                "cache-control": "max-age=31536000, public, immutable"
            }
        },
    )
})

app.get("/api/project/:id", async c => c.json(
    await api.project(c.req.param("id"))
))
app.get("/api/js/:id", async c => {
    c.header("content-type", "application/javascript; charset=utf-8")

    const project = await api.project(c.req.param("id"))
        .then(JSON.stringify)
        .then(parseProject) as Project & {
            updated: string
        }

    c.header(
        "last-modified",
        new Date(project.updated).toUTCString(),
    )
    c.header(
        "cache-control",
        "no-cache",
    )

    const a = new Date(c.req.header("if-modified-since") || 0)
    const b = new Date(new Date(project.updated).toUTCString())

    if (a < b) {
        const label = `Generate ${c.req.param("id")}.js`
        console.time(label)

        const result = c.body(api.js(project))
        
        console.timeEnd(label)
        return result
    } else {
        c.status(304)
        return c.body(null)
    }
})

app.get("/", async c => c.html(
    await Deno.readTextFile("view/index.html")
))
app.get("/p/:id", async c => c.html(
    (await Deno.readTextFile("view/p.html"))
    .replace(
        "<!-- VERSION_LABEL -->",
        `@${
            Deno.env.get("VERSION_LABEL")
            || "dev"
        }`
    )
    .replace("<!-- INSERT SCRIPT HERE -->", `
        <script type="module">
            import { Entry } from "/api/js/${c.req.param("id")}"
            await Entry.init(
                document.querySelector("app")
            )
            Entry.start()
        </script>
    `)
))

Deno.serve(app.fetch)

export { app }