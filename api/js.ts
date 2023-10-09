import { project } from "./project.ts"
import { parseProject, projectToJs } from "../deps/enz.ts"

export const js = async (id: string) =>
    await project(id)
        .then(JSON.stringify)
        .then(parseProject)
        .then(projectToJs)
        .then(x => `import { init } from "/src/mod.ts"` + "\nexport const Entry =\n" + x)