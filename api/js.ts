import { project } from "./project.ts"
import { parseProject, projectToJs } from "../deps/enz.ts"

export const js = async (id: string) =>
    await project(id)
        .then(JSON.stringify)
        .then(parseProject)
        .then(projectToJs)
        .then(x => x
            .replaceAll(
                "() =>",
                "async () =>",
            )
            .replaceAll(
                "Entry.wait",
                "await Entry.wait",
            )
            .replaceAll(
                "Entry.repeat",
                "await Entry.repeat",
            )
        )
        .then(x => `import { init } from "/src/mod.ts"` + "\nexport const Entry =\n" + x)