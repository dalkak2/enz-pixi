import { Hono } from "https://esm.sh/hono@4.7.10"
import { etag } from "https://esm.sh/hono@4.7.10/etag"
import { serveStatic } from "https://esm.sh/hono@4.7.10/deno"

import { esbuildTranspiler } from "https://esm.sh/@hono/esbuild-transpiler@0.1.3"
import * as esbuild from "https://deno.land/x/esbuild@v0.19.5/wasm.js"

import * as api from "./api/mod.ts"

const env = Deno.env.get("DENO_DEPLOYMENT_ID")
    ? "deploy"
    : "dev"

console.log(`env: ${env}`)

const app = new Hono()

import {
    parseProject,
    Project,
} from "./deps/enz.ts"

const {
    hash,
    tag,
    branch,
} = Deno.env.toObject()

app.use("/src/*", etag({weak: true}))
if (env == "dev") {
    app.get("/src/*", esbuildTranspiler({ esbuild }))
    app.get("/src/*", serveStatic({ root: "./" }))
} else {
    app.get("/src/*", serveStatic({
        root: "./dist/",
        mimes: { ts: "application/javascript" },
    }))
}

app.use("/deps/*", etag({weak: true}))
app.get("/deps/*", esbuildTranspiler({ esbuild }))
app.get("/deps/*", serveStatic({ root: "./" }))

// /image/lib/entryjs/images/
// /image/lib/entry-js/images/
app.get("/image/lib/*/images/*", async c => {
    const path = new URL(c.req.url).pathname
        .replace(/^\/image\//, "https://playentry.org/")
    return c.body(
        (await api.image(path))!,
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
        (await api.image(
            `https://playentry.org/uploads/${
                a + b
            }/${
                d + e
            }/image/${id}`
        ))!,
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
        (await api.image(path))!,
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
        (await api.image(
            `https://playentry.org/uploads/${
                a + b
            }/${
                d + e
            }/${id}`
        ))!,
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
            tag ? tag :
            hash ? `${hash.slice(0, 7)} (${branch})` :
            "local"
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
