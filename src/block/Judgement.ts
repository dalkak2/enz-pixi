import { Module } from "../Module.ts"
import { EntryContainer } from "../obj/mod.ts"

export class Judgement extends Module {
    pressedKeys: Record<number, boolean | undefined> = {}

    // deno-lint-ignore require-await
    override async init() {
        document.body.addEventListener("keydown", event => {
            this.pressedKeys[event.keyCode] = true
        })
        document.body.addEventListener("keyup", event => {
            this.pressedKeys[event.keyCode] = false
        })
    }

    /*
        These blocks are transpiled from server.
        Check ../api/js.ts
        ```
        True
        False
        ```
    */
    is_clicked() {
        return this.isClicked
    }
    is_object_clicked(obj: EntryContainer) {
        return obj.isClicked
    }
    is_press_some_key(keyCode: string) {
        return !!this.pressedKeys[Number(keyCode)]
    }
    reach_something(targetId: string, obj: EntryContainer) {
        if (targetId == "mouse") {
            return obj.isTouched
        }
        throw new Error("reach_something - mouse 제외 미구현")
    }
    boolean_basic_operator(
        a: number | string,
        op:
            | "EQUAL"
            | "NOT_EQUAL"
            | "GREATER"
            | "LESS"
            | "GREATER_OR_EQUAL"
            | "LESS_OR_EQUAL"
            ,
        b: number | string,
    ) {
        if (op == "EQUAL")              return a == b
        if (op == "NOT_EQUAL")          return a != b
        if (op == "GREATER")            return a > b
        if (op == "LESS")               return a < b
        if (op == "GREATER_OR_EQUAL")   return a >= b
        if (op == "LESS_OR_EQUAL")      return a <= b
    }
    boolean_and_or(
        a: boolean,
        op: "AND" | "OR",
        b: boolean,
    ) {
        if (op == "AND") return a && b
        if (op == "OR")  return a || b
    }
    boolean_not(b: boolean) {
        return !b
    }
}
