import { project } from "./project.ts"
import {
    parseProject,
    Visitor,
    Object_,
    cg,
    Project,
} from "../deps/enz.ts"
import JSON5 from "https://esm.sh/json5@2.2.3?pin=v135"

import { format } from "./util/format.ts"

class PixiVisitor extends Visitor {
    visitObject(object: Object_): string {
        const script = super.visitObject(object)
        const {
            selectedPictureId,
            scene,
            entity,
            sprite,
        } = object
        return ``
            + `class Obj_${object.id} extends EntrySprite { `
                + `constructor(...args) {\n    super(...args)\n${
                    script
                        .split("\n")
                        .map(x => "    " + x)
                        .join("\n")
                }\n}`
            + `}; Entry.objects["${object.id}"] = Obj_${object.id}.fromEntryData(${
                JSON5.stringify({
                    selectedPictureId,
                    scene,
                    entity,
                    sprite,
                })
            }, Entry)`
    }
    objectToExpressions({script}: Object_) {
        return this.scriptToExpressions(script)
            .map(expr => expr.replaceAll(`"$obj$"`, "this") as cg.Expression)
    }
}

export const jsUnformatted = async (id: string) =>
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

export const js = async (id: string) => {
    const src = await jsUnformatted(id)
    return format(src)
}