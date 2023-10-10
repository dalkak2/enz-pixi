import { project } from "./project.ts"
import { parseProject, projectToJs } from "../deps/enz.ts"

export const js = async (id: string) =>
    await project(id)
        .then(JSON.stringify)
        .then(parseProject)
        .then(projectToJs)
        .then(x => x
            .replaceAll(
                "= (",
                "= async (",
            )
            .replaceAll(
                "() =>",
                "async () =>",
            )
            .replaceAll(
                "Entry.wait_",
                "await Entry.wait_",
            )
            .replaceAll(
                "Entry.repeat_",
                "await Entry.repeat_",
            )
            .replaceAll(
                /(Entry\.func_.{4}\()/g,
                "await $1",
            )
            .replaceAll(
                "Entry._if",
                "await Entry._if",
            )
        )
        .then(x => `import { init } from "/src/mod.ts"` + "\nexport const Entry =\n" + x)