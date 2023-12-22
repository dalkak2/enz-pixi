import { project } from "../api/project.ts"

Deno.test("api/project", async () => {
    console.log(await project("652371adb7aa680135cc2070"))
})