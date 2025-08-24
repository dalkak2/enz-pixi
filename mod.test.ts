import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts"

import { app } from "./mod.ts"

console.log(
    await app.request("/src/mod.ts")
)

const check = async (filename: string) => {
    const res = await app.request(filename)
    assertEquals(
        res.status,
        200,
    )
}

Deno.test("build", async () => {
    await check("/src/Entry.ts")
    await check("/src/obj/mod.ts")
    await check("/src/obj/EntryBrush.ts")
    await check("/src/obj/EntryContainer.ts")
    await check("/src/obj/EntrySprite.ts")
    await check("/src/obj/EntryText.ts")
    await check("/src/mod.ts")
    await check("/src/util.ts")
    await check("/deps/pixi.ts")
})
