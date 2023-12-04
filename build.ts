import { assertEquals, assert } from "https://deno.land/std@0.202.0/assert/mod.ts"

import { app } from "./mod.ts"

console.log(
    await app.request("/src/mod.ts")
)

Deno.test("build", async () => {
    const res = await app.request("/src/mod.ts")
    assertEquals(
        res.status,
        200,
    )
    assert(
        (await res.text()).startsWith("export")
    )
})