import type { Project } from "../deps/enz.ts"
import {
    autoDetectRenderer,
    Renderer,
    Container,
    Assets,
    Texture,
} from "../deps/pixi.ts"

import type { EntrySprite } from "./EntrySprite.ts"
import { Timer } from "./Timer.ts"

const mod =
    (a: number, n: number) =>
        ((a % n) + n) % n

const toRadian =
    (deg: number) =>
        deg * Math.PI / 180

const toDegrees =
    (rad: number) =>
        rad * 180 / Math.PI

export class Entry {
    project
    renderer?: Renderer
    events: Record<string, (() => void)[]>
    scenes: Record<string, Container> = {}
    variables: Record<string, string | number> = {}
    textures: Record<string, Texture> = {}
    objects: Record<string, EntrySprite> = {}

    pressedKeys: Record<number, boolean | undefined> = {}
    currentScene: Container

    timer = new Timer()

    constructor(project: Project) {
        this.project = project
        this.events = {}

        this.scenes = Object.fromEntries(
            this.project.scenes.map(
                ({id}) => {
                    const container = new Container()
                    return [
                        id,
                        container,
                    ]
                }
            )
        )
        this.currentScene = Object.values(this.scenes)[0]
    }
    async init(parent: HTMLElement) {
        this.variables = Object.fromEntries(
            this.project.variables.map(
                ({id, value}) => {
                    return [
                        id,
                        value,
                    ]
                }
            )
        )
        this.textures = Object.fromEntries(await Promise.all(
            this.project.objects.map(({sprite}) =>
                sprite.pictures.map(
                    async ({id, fileurl, filename, imageType, name}) => {
                        const url = `/image/${
                            filename
                            ? (filename + `.${imageType}`)
                            : fileurl.substring(1)
                        }`
                        await Assets.load(url)
                        const texture = Texture.from(url)
                        texture.label = name
                        return [
                            id,
                            texture,
                        ]
                    }
                )
            )
            .flat()
        ))
        console.log(this.textures)
        Object.entries(this.objects).forEach(([_id, obj]) => {
            obj.texture = this.textures[obj.textureIds[obj.currentTextureIndex]]
        })
        /*
        this.objects = Object.fromEntries(
            this.project.objects.toReversed().map(
                (object) => {
                    const sprite = new EntrySprite(
                        object,
                        this,
                    )
                    return [
                        object.id,
                        sprite,
                    ]
                }
            )
        )
        */

        document.body.addEventListener("keydown", event => {
            this.pressedKeys[event.keyCode] = true
        })
        document.body.addEventListener("keyup", event => {
            this.pressedKeys[event.keyCode] = false
        })

        console.log("Init")
        // @ts-ignore: Unknown error???
        this.renderer = await autoDetectRenderer({
            width: 480,
            height: 270,
            backgroundColor: "#fff",
            resolution: 4
        })
        parent.appendChild(this.renderer.canvas)
        
        const loop = () => {
            this.render()
            requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
    }
    emit(eventName: string) {
        this.events[eventName].forEach(
            f => f()
        )
    }
    on(eventName: string, f: () => void) {
        if (!this.events[eventName]) {
            this.events[eventName] = []
        }
        this.events[eventName].push(f)
    }
    start() {
        this.emit("start")
    }
    render() {
        this.renderer!.render({
            container: this.currentScene
        })
    }
    wait_tick() {
        return new Promise(o => {
            requestAnimationFrame(o)
        })
    }

    /* 시작 */
    when_run_button_click(f: () => void) {
        this.on("start", f)
    }
    when_scene_start(f: () => void) {
        this.on("scene_start", f)
    }
    start_neighbor_scene(type: "prev" | "next") {
        const currentSceneIndex = Object.values(this.scenes).findIndex(scene => scene == this.currentScene)
        if (type == "prev") {
            this.currentScene = Object.values(this.scenes)[currentSceneIndex - 1]
        }
        if (type == "next") {
            this.currentScene = Object.values(this.scenes)[currentSceneIndex + 1]
        }
        this.emit("scene_start")
    }
    
    /* 흐름 */
    wait_second(sec: number) {
        return new Promise(o => {
            setTimeout(o, sec * 1000)
        })
    }
    /*
        These blocks are transpiled from server.
        Check ../api/js.ts
        ```
        repeat_basic
        repeat_inf
        repeat_while_true
        _if
        if_else
        ```
    */
    create_clone(targetId: string, obj: EntrySprite) {
        const target =
            targetId == "self"
                ? obj
                : this.objects[targetId]
        target.clone(this)
    }
    when_clone_start(f: () => void, obj: EntrySprite) {
        obj.on("clone", f)
    }
    delete_clone(obj: EntrySprite) {
        if (obj.isClone) {
            obj.destroy()
        }
    }

    /* 움직임 */
    move_direction(n: number, obj: EntrySprite) {
        obj.x += n * Math.sin(toRadian(obj.direction))
        obj.y -= n * Math.cos(toRadian(obj.direction))
    }
    move_x(n: number, obj: EntrySprite) {
        obj.x += n
    }
    move_y(n: number, obj: EntrySprite) {
        obj.y -= n
    }
    locate_x(x: number, obj: EntrySprite) {
        obj.x = x + 240
    }
    locate_y(y: number, obj: EntrySprite) {
        obj.y = -y + 135
    }
    locate_xy(x: number, y: number, obj: EntrySprite) {
        this.locate_x(x, obj)
        this.locate_y(y, obj)
    }
    rotate_relative(angle: number, obj: EntrySprite) {
        obj.angle += angle
    }
    direction_relative(angle: number, obj: EntrySprite) {
        obj.direction += angle
    }
    rotate_absolute(angle: number, obj: EntrySprite) {
        obj.angle = angle
    }
    direction_absolute(angle: number, obj: EntrySprite) {
        obj.direction = angle
    }

    /* 생김새 */
    show(obj: EntrySprite) {
        obj.visible = true
    }
    hide(obj: EntrySprite) {
        obj.visible = false
    }
    dialog(text: string, type: "speak" | "think", obj: EntrySprite) {
        console.log(`Object_${obj} ${type}s:`, text)
    }
    change_to_next_shape(type: "next" | "prev", obj: EntrySprite) {
        if (type == "next") {
            obj.currentTextureIndex += 1
        }
        if (type == "prev") {
            obj.currentTextureIndex -= 1
        }
        obj.currentTextureIndex =
            mod(
                obj.currentTextureIndex,
                obj.textureIds.length,
            )
        obj.texture = this.textures[
            obj.textureIds[
                obj.currentTextureIndex
            ]
        ]
    }
    add_effect_amount(
        type:
            | "transparency"
            | "color"
            | "brightness",
        amount: number,
        obj: EntrySprite,
    ) {
        if (type == "transparency")
            obj.alpha -= amount / 100
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`)
    }
    change_effect_amount(
        type:
            | "transparency"
            | "color"
            | "brightness",
        amount: number,
        obj: EntrySprite,
    ) {
        if (type == "transparency")
            obj.alpha = 1 - amount / 100
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`)
    }
    change_scale_size(d: number, obj: EntrySprite) {
        obj.size += d
    }
    set_scale_size(newSize: number, obj: EntrySprite) {
        obj.size = newSize
    }

    /* 판단 */
    /*
        These blocks are transpiled from server.
        Check ../api/js.ts
        ```
        True
        False
        ```
    */
    is_press_some_key(keyCode: string) {
        return !!this.pressedKeys[Number(keyCode)]
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


    /* 계산 */
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
        obj: EntrySprite,
    ) {
        const target =
            targetId == "self"
                ? obj
                : this.objects[targetId]
        switch (type) {
            case "x":
                return target.x - 240
            case "y":
                return -target.y + 135
            case "rotation":
                return target.angle
            case "direction":
                return target.direction
            case "picture_index":
                return target.currentTextureIndex
            case "size":
                return target.size
            case "picture_name":
                return target.texture.label
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
        if (op == "MOD") return a % b
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
            case "unnatural": return n % 1
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

    /* 자료 */
    get_variable(id: string) {
        return this.variables[id]
    }
    change_variable(id: string, value: number) {
        // @ts-ignore: lol
        this.variables[id] += Number(value)
    }
    set_variable(id: string, value: string | number) {
        this.variables[id] = value
    }
}