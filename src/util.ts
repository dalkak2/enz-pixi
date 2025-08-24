import type { Project } from "../deps/enz.ts"
import { Entry } from "./Entry.ts"

export const init =
(project: Project) => {
    const ctx = new Entry()
    ctx.loadProject(project)
    return ctx
}
