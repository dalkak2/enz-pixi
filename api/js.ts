import { project } from "./project.ts"
import {
    parseProject,
    Visitor,
    Object_,
 } from "../deps/enz.ts"

class PixiVisitor extends Visitor {
    visitObject(object: Object_): string {
        const script = super.visitObject(object)
        return ``
            + `class Obj_${object.id} extends EntrySprite { `
                + `constructor() {\n    super()\n${
                    script
                        .split("\n")
                        .map(x => "    " + x)
                        .join("\n")
                }\n}`
            + `}; new Obj_${object.id}()`
    }
}

export const js = async (id: string) =>
    await project(id)
        .then(JSON.stringify)
        .then(parseProject)
        .then(x => (new PixiVisitor).visitProject(x))
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
            .replaceAll(
                "Entry.if_else",
                "await Entry.if_else",
            )
        )
        .then(x => `import { init, EntrySprite } from "/src/mod.ts"` + "\nexport const Entry =\n" + x)