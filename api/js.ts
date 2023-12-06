import { project } from "./project.ts"
import {
    parseProject,
    Visitor,
    Object_,
    cg,
    Block,
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
    blockGroupToExpressions(blockGroup: Block[]) {
        return blockGroup.map(
            this.blockToExpression.bind(this)
        ).join("\n")
    }
    normalBlockToExpression(block: Block) {
        const params = this.paramsToExpressions(block.params)
        const statements = block.statements.map(
            this.blockGroupToExpressions.bind(this)
        )

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
                "Entry.wait_second",
                "await Entry.wait_second",
            )
            .replaceAll(
                "Entry.message_cast_wait",
                "await Entry.message_cast_wait",
            )
            .replaceAll(
                /(Entry\.func_.{4}\()/g,
                "await $1",
            )
        )
        .then(x => `import { init, EntrySprite } from "/src/mod.ts"` + "\nexport const Entry =\n" + x)

export const js = async (id: string) => {
    const src = await jsUnformatted(id)
    return format(src)
}