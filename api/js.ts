import {
    Visitor,
    Object_,
    cg,
    Block,
    Project,
    idCheck,
} from "../deps/enz.ts"
import JSON5 from "https://esm.sh/json5@2.2.3?pin=v135"

import { format } from "./util/format.ts"

class PixiVisitor extends Visitor {
    override getInitData(project: Project) {
        return {
            ...project,
            objects: project.objects.map(
                ({id, sprite}) => ({id, sprite})
            ),
            functions: project.functions.map(
                ({content: _, ...rest}) => rest
            ),
        // deno-lint-ignore no-explicit-any
        } as any
    }
    override visitObject(object: Object_): string {
        const script = super.visitObject(object)
        const {
            id,
            name,
            selectedPictureId,
            scene,
            entity,
            sprite,
            objectType,
        } = object
        idCheck(object.id)
        return ``
            + `class Obj_${object.id} extends ${
                {
                    sprite: "EntrySprite",
                    textBox: "EntryText",
                }[object.objectType] || `(() => {throw new Error("Unknown objectType")})()`
            } { `
                + `constructor(...args) {\n    super(...args)\n${
                    script
                        .split("\n")
                        .map(x => "    " + x)
                        .join("\n")
                }\n}`
            + `}; Entry.objects["${object.id}"] = Obj_${object.id}.fromEntryData(${
                JSON5.stringify({
                    id,
                    name,
                    selectedPictureId,
                    scene,
                    entity,
                    sprite,
                    objectType,
                })
            }, Entry)`
    }
    override objectToExpressions({script}: Object_) {
        return this.scriptToExpressions(script)
            .map(expr => expr.replaceAll(`"$obj$"`, "this") as cg.Expression)
    }
    blockGroupToExpressions(blockGroup: Block[] = []) {
        return blockGroup.map(
            this.blockToExpression.bind(this)
        ).join("\n")
    }
    override normalBlockToExpression(block: Block) {
        const params = this.paramsToExpressions(block.params)
        const statements = block.statements?.map(
            this.blockGroupToExpressions.bind(this)
        ) || []

        switch (block.type) {
            case "repeat_basic": {
                const i = "i_" + Math.random().toString(36).substring(2,6)
                return `for (
                    let ${i} = 0;
                    ${i} < ${params[0]};
                    ${i}++
                ) {
                    ${statements[0]}
                    await Entry.wait_tick()
                }` as cg.Expression
            }

            case "repeat_inf":
                return `while (true) {
                    ${statements[0]}
                    await Entry.wait_tick()
                }` as cg.Expression

            case "repeat_while_true":
                return `while (${
                    params[1] == `"until"`
                        ? "!" // "until"
                        : ""  // "while"
                }${params[0]}) {
                    ${statements[0]}
                    await Entry.wait_tick()
                }` as cg.Expression

            case "stop_repeat":
                return "break" as cg.Expression

            case "_if":
                return `if (${params[0]}) {
                    ${statements[0]}
                }` as cg.Expression

            case "if_else":
                return `if (${params[0]}) {
                    ${statements[0]}
                } else {
                    ${statements[1]}
                }` as cg.Expression

            case "wait_until_true":
                return `while (!${params[0]}) {
                    await Entry.wait_tick()
                }` as cg.Expression

            case "True":
                return "true" as cg.Expression

            case "False":
                return "false" as cg.Expression

            default:
                return super.normalBlockToExpression(block)
        }
    }
}

export const jsUnformatted = (project: Project) => {
    let js = (new PixiVisitor).visitProject(project)
    js = js
        .replaceAll(
            "= (",
            "= async (",
        )
        .replaceAll(
            "() =>",
            "async () =>",
        )
        .replaceAll(
            "Entry.wait_second",
            "await Entry.wait_second",
        )
        .replaceAll(
            "Entry.message_cast_wait",
            "await Entry.message_cast_wait",
        )
        .replaceAll(
            "Entry.sound_something_wait_with_block",
            "await Entry.sound_something_wait_with_block",
        )
        .replaceAll(
            "Entry.sound_something_second_wait_with_block",
            "await Entry.sound_something_second_wait_with_block",
        )
        .replaceAll(
            "Entry.sound_from_to_and_wait",
            "await Entry.sound_from_to_and_wait",
        )
        .replaceAll(
            "Entry.move_xy_time",
            "await Entry.move_xy_time",
        )
        .replaceAll(
            "Entry.locate_xy_time",
            "await Entry.locate_xy_time",
        )
        .replaceAll(
            /(Entry\.func_.{4}\()/g,
            "await $1",
        )
        .replaceAll(
            /let (v_.+?);/g,
            "let $1 = 0;",
        )
    js = `import { init, EntrySprite, EntryText } from "/src/mod.ts"` + "\nexport const Entry =\n" + js
    return js
}

export const js = (project: Project, formatFlag = false) => {
    const src = jsUnformatted(project)
    return formatFlag
        ? format(src)
        : src
}