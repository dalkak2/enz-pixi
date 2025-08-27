import { Module, toRadian, toDegrees, mod } from "../Module.ts"
import { EntryContainer, EntrySprite } from "../obj/mod.ts"

class Timer {
    checkpoint: number | false = false
    acc = 0
    get time() {
        return this.checkpoint
            ? this.acc + Date.now() - this.checkpoint
            : this.acc
    }
    start() {
        this.acc = this.time
        this.checkpoint = Date.now()
    }
    stop() {
        this.acc = this.time
        this.checkpoint = false
    }
    reset() {
        this.acc = 0
        if (this.checkpoint) {
            this.checkpoint = Date.now()
        }
    }
}

export class Calc extends Module {
    timer = new Timer()
    
    angle(n: number) {
        return Number(n)
    }
    calc_basic(
        a: number,
        op: "PLUS" | "MINUS" | "MULTI" | "DIVIDE",
        b: number,
    ) {
        a = Number(a)
        b = Number(b)
        if (op == "PLUS")   return a + b
        if (op == "MINUS")  return a - b
        if (op == "MULTI")  return a * b
        if (op == "DIVIDE") return a / b
        throw "nope!"
    }
    calc_rand(a: number, b: number) {
        return Math.random() * (b - a) + a
    }
    coordinate_mouse(type: "x" | "y") {
        if (type == "x") return this.mouse.x
        if (type == "y") return this.mouse.y
    }
    coordinate_object(
        targetId: string,
        type:
            | "x"
            | "y"
            | "rotation"
            | "direction"
            | "picture_index"
            | "size"
            | "picture_name",
        obj: EntryContainer,
    ) {
        const target =
            targetId == "self"
                ? obj
                : this.objects[targetId]
        switch (type) {
            case "x":
                return target.x
            case "y":
                return target.y
            case "rotation":
                return target.rotation
            case "direction":
                return target.direction
            case "picture_index":
                return target.currentTextureIndex
            case "size":
                return target.size
            case "picture_name":
                if (target instanceof EntrySprite) {
                    return target.pixiSprite.texture.label
                } else {
                    throw new Error("TextBox doesn't have picture_name")
                }
        }
    }
    quotient_and_mod(
        a: number,
        b: number,
        op:
            | "QUOTIENT"
            | "MOD"
    ) {
        if (op == "QUOTIENT") return Math.floor(a / b)
        if (op == "MOD") return mod(a, b)
        throw new Error("nope")
    }
    calc_operation(
        n: number,
        op:
            | "square"
            | "root"
            | "sin"
            | "cos"
            | "tan"
            | "asin"
            | "acos"
            | "atan"
            | "log"
            | "ln"
            | "unnatural"
            | "floor"
            | "ceil"
            | "round"
            | "factorial"
            | "abs"
    ) {
        switch (op) {
            case "square": return n * n
            case "root": return Math.sqrt(n)
            case "log": return Math.log(n) / Math.LN10
            case "ln": return Math.log(n)
            case "sin":
            case "cos":
            case "tan":
                return Math[op](toRadian(n))
            case "asin":
            case "acos":
            case "atan":
                return toDegrees(Math[op](n))
            case "unnatural": return mod(n, 1)
            case "factorial": throw "Unimplemented: factorial"
            default: return Math[op](n)
        }
    }
    get_project_timer_value() {
        return this.timer.time / 1000
    }
    choose_project_timer_action(
        action: "START" | "STOP" | "RESET"
    ) {
        if (action == "START")  this.timer.start()
        if (action == "STOP")   this.timer.stop()
        if (action == "RESET")  this.timer.reset()
    }
    set_visible_project_timer() {
        console.log("skip:", "set_visible_project_timer")
    }
    get_date(
        type:
            | "YEAR"
            | "MONTH"
            | "DAY"
            | "DAY_OF_WEEK"
            | "HOUR"
            | "MINUTE"
            | "SECOND"
    ) {
        switch (type) {
            case "YEAR":
                return new Date().getFullYear()
            case "MONTH":
                return new Date().getMonth() + 1
            case "DAY":
                return new Date().getDate()
            case "HOUR":
                return new Date().getHours()
            case "MINUTE":
                return new Date().getMinutes()
            case "DAY_OF_WEEK":
                return "일월화수목금토"[new Date().getDay()]
            case "SECOND":
                return new Date().getSeconds()
        }
    }
    distance_something(targetId: string, obj: EntryContainer) {
        let target: { x: number, y: number }
        if (targetId == "mouse") {
            target = this.mouse
        } else {
            target = this.objects[targetId]
        }
        const dx = target.x - obj.x
        const dy = target.y - obj.y
        return Math.sqrt(
            dx**2 + dy**2
        )
    }
    get_user_name() {
        return " "
    }
    get_nickname() {
        return " "
    }
    length_of_string(str: string | number) {
        return String(str).length
    }
    count_match_string(where: string | number, what: string) {
        return String(where).match(new RegExp(`(?=${what})`, "g"))?.length || 0
    }
    combine_something(a: string | number, b: string | number) {
        return `${a}${b}`
    }
    char_at(str: string | number, i: number) {
        return String(str)[i - 1]
    }
    substring(where: string | number, from: number, to: number) {
        return String(where).substring(
            Math.min(from, to) - 1,
            Math.max(from, to),
        )
    }
    index_of_string(where: string | number, what: string) {
        return String(where).indexOf(what) + 1
    }
    replace_string(where: string | number, from: string, to: string) {
        return String(where).replaceAll(from, to)
    }
    reverse_of_string(str: string | number) {
        return String(str).split("").reverse().join("")
    }
    change_string_case(
        str: string | number,
        type: "toUpperCase" | "toLowerCase",
    ) {
        return String(str)[type]()
    }
    change_rgb_to_hex(
        r: number,
        g: number,
        b: number,
    ) {
        return "#" +
            [r, g, b].map(
                n => Math.floor(n)
                    .toString(16)
                    .padStart(2, "0")
            ).join("")
    }
}
