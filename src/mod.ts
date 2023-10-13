import { Project } from "../deps/enz.ts"
import {
    Ticker,
    autoDetectRenderer,
    Renderer,
    Sprite,
    Container,
    Assets,
    Texture,
    TextString,
    returnFilterEffect,
} from "https://esm.sh/v132/pixi.js@8.0.0-beta.5"

export const init =
    (project: Project) =>
        new Entry(project)

const mod =
    (a: number, n: number) =>
        ((a % n) + n) % n

const toDegrees =
    (rad: number) =>
        rad * 180 / Math.PI

export class EntrySprite extends Sprite {
    textureIds: string[] = []
    currentTextureIndex = 0

    constructor(...args: ConstructorParameters<typeof Sprite>) {
        super(...args)
    }
    get size() {
        return (this.width + this.height) / 2
    }
    set size(newSize: number) {
        const scale = Math.max(1, newSize) / this.size
        this.scale.x *= scale
        this.scale.y *= scale
    }
}

export class Timer {
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
        this.checkpoint = Date.now()
    }
}

export class Entry {
    project
    renderer?: Renderer
    events: Record<string, (() => void)[]>
    scenes: Record<string, Container> = {}
    variables: Record<string, string | number> = {}
    textures: Record<string, Texture> = {}
    objects: Record<string, EntrySprite> = {}

    pressedKeys: Record<number, boolean | undefined> = {}

    timer = new Timer()

    constructor(project: Project) {
        this.project = project
        this.events = {
            start: []
        }
    }
    async init(parent: HTMLElement) {
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
                    async ({id, fileurl, filename, imageType}) => {
                        const url = `/image/${
                            filename
                            ? (filename + `.${imageType}`)
                            : fileurl.substring(1)
                        }`
                        await Assets.load(url)
                        const texture = Texture.from(url)
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
        this.objects = Object.fromEntries(
            this.project.objects.toReversed().map(
                ({
                    id,
                    selectedPictureId,
                    scene,
                    entity,
                    sprite: {
                        pictures,
                        sounds,
                    },
                }) => {
                    console.log(selectedPictureId)
                    const sprite = new EntrySprite(
                        this.textures[selectedPictureId]
                    )
                    sprite.textureIds = pictures.map(
                        ({id}) => id
                    )
                    sprite.currentTextureIndex = sprite.textureIds.indexOf("selectedPictureId")
                    sprite.anchor.set(0.5)
                    sprite.x = entity.x + 240
                    sprite.y = -entity.y + 135
                    sprite.scale = {
                        x: entity.scaleX,
                        y: entity.scaleY,
                    }
                    this.scenes[scene].addChild(sprite)
                    return [
                        id,
                        sprite,
                    ]
                }
            )
        )

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
    }
    emit(eventName: string) {
        this.events[eventName].forEach(
            f => f()
        )
    }
    on(eventName: string, f: () => void) {
        this.events[eventName].push(f)
    }
    start() {
        this.emit("start")
    }
    render() {
        Object.values(this.scenes)[0].x
        this.renderer!.render({
            container: Object.values(this.scenes)[0]
        })
    }
    wait_tick() {
        this.render()
        return new Promise(o => {
            requestAnimationFrame(o)
        })
    }

    /* 시작 */
    when_run_button_click(f: () => void) {
        this.on("start", f)
    }
    
    /* 흐름 */
    wait_second(sec: number) {
        this.render()
        return new Promise(o => {
            setTimeout(o, sec * 1000)
        })
    }
    async repeat_basic(n: number, f: () => Promise<void>) {
        let i = 0
        await this.repeat_inf(async ctx => {
            if (++i > n) {
                ctx.destroy()
                return
            }
            await f()
        })
    }
    async repeat_inf(f: (ctx: {
        destroy: () => void
    }) => Promise<void>) {
        let breaker = false
        while (true) {
            await f({
                destroy: () => {
                    breaker = true
                }
            })
            if (breaker) break
            await this.wait_tick()
        }
    }
    async _if(state: boolean, f: () => Promise<void>) {
        if (state) await f()
    }
    async if_else(
        state: boolean,
        o: () => Promise<void>,
        x: () => Promise<void>,
    ) {
        if (state) await o()
        else await x()
    }

    /* 움직임 */
    move_x(n: number, id: string) {
        this.objects[id].x += n
    }
    move_y(n: number, id: string) {
        this.objects[id].y -= n
    }
    locate_x(x: number, id: string) {
        this.objects[id].x = x + 240
    }
    locate_y(y: number, id: string) {
        this.objects[id].y = -y + 135
    }
    locate_xy(x: number, y: number, id: string) {
        this.locate_x(x, id)
        this.locate_y(y, id)
    }

    /* 생김새 */
    dialog(text: string, type: "speak" | "think", objId: string) {
        console.log(`Object_${objId} ${type}s:`, text)
    }
    change_to_next_shape(type: "next" | "prev", id: string) {
        const obj = this.objects[id]
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
        id: string,
    ) {
        if (type == "transparency")
            this.objects[id].alpha += amount / 100
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`)
    }
    change_effect_amount(
        type:
            | "transparency"
            | "color"
            | "brightness",
        amount: number,
        id: string,
    ) {
        if (type == "transparency")
            this.objects[id].alpha = amount / 100
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`)
    }
    change_scale_size(d: number, id: string) {
        this.objects[id].size += d
    }
    set_scale_size(newSize: number, id: string) {
        this.objects[id].size = newSize
    }

    /* 판단 */
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