import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts"

import { app } from "./mod.ts"

import { stringify } from "https://deno.land/std@0.210.0/dotenv/mod.ts"

console.log(
    await app.request("/src/mod.ts")
)

const build = async (filename: string) => {
    const res = await app.request(filename)
    assertEquals(
        res.status,
        200,
    )
}

const writeEnv = async (env: Record<string, string>) => {
    await Deno.writeTextFile(".env", stringify(env))
}

const [ VERSION_LABEL ] = Deno.args

Deno.test("build", async () => {
    await writeEnv({
        VERSION_LABEL: VERSION_LABEL.slice(0, 7),
    })
    await build("/src/Entry.ts")
    await build("/src/EntrySprite.ts")
    await build("/src/mod.ts")
    await build("/src/Timer.ts")
    await build("/src/util.ts")
    await build("/deps/pixi.ts")
})