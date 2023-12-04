import { assertEquals, assert } from "https://deno.land/std@0.202.0/assert/mod.ts"

import { app } from "./mod.ts"

console.log(
    await app.request("/src/mod.ts")
)

const build = (filename: string) => {
    const res = await app.request(filename)
    assertEquals(
        res.status,
        200,
    )
}

Deno.test("build", async () => {
    build("/src/Entry.ts")
    build("/src/EntrySprite.ts")
    build("/src/mod.ts")
    build("/src/Timer.ts")
    build("/src/util.ts")
})