import type { Project } from "../deps/enz.ts"
import {
    WebGLRenderer,
    Renderer,
    Container,
    Assets,
    Texture,
} from "../deps/pixi.ts"

import {
    EntryContainer,
    EntryBrush,
    EntrySprite,
    EntryText,
} from "./obj/mod.ts"

import { Timer } from "./Timer.ts"

export const wait_second =
    (sec: number) =>
        new Promise(o => {
            setTimeout(o, sec * 1000)
        })

export const toRadian =
    (deg: number) =>
        deg * Math.PI / 180

export const toDegrees =
    (rad: number) =>
        rad * 180 / Math.PI

export class Module {
    project
    renderer?: Renderer

    audioContext = new AudioContext()
    gainNode = this.audioContext.createGain()
    get volume() {
        return this.gainNode.gain.value * 100
    }
    set volume(n: number) {
        this.gainNode.gain.value = n / 100
    }

    events: Record<string, (() => Promise<void>)[]>
    scenes: Record<string, Container> = {}
    variables: Record<string, string | number | (string | number)[]> = {}
    textures: Record<string, Texture> = {}
    sounds: Record<string, AudioBuffer> = {}
    objects: Record<string, EntryContainer> = {}

    pressedKeys: Record<number, boolean | undefined> = {}
    currentScene: Container

    timer = new Timer()

    isClicked = false
    mouse = {
        x: 0,
        y: 0,
    }

    constructor(project: Project) {
        this.gainNode.connect(this.audioContext.destination)

        this.project = project
        this.events = {}

        this.scenes = Object.fromEntries(
            this.project.scenes.map(
                ({id}) => {
                    const container = new Container()
                    container.label = id
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
                ({id, value, array, variableType}) => {
                    return [
                        id,
                        variableType == "list"
                            ? array?.map(({data}) => data)
                            : value,
                    ]
                }
            )
        )
        this.textures = Object.fromEntries(await Promise.all(
            this.project.objects.map(({sprite}) =>
                sprite.pictures.map(
                    async ({id, fileurl, filename, name}) => {
                        let url = `/image/${
                            filename
                            ? (filename + `.png`)
                            : fileurl!.substring(1)
                        }`

                        // for server-side svg rasterize
                        if (url.endsWith(".svg")) {
                            url += ".png"
                        }
                        
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
        this.sounds = Object.fromEntries(await Promise.all(
            this.project.objects.map(({sprite}) =>
                sprite.sounds.map(
                    async ({id, fileurl, filename, ext, name}) => {
                        const url = `/sound/${
                            filename
                            ? (filename + (ext || ".mp3"))
                            : fileurl!.substring(1)
                        }`

                        const audioBuffer = await fetch(url)
                            .then(res => res.arrayBuffer())
                            .then(buffer => this.audioContext.decodeAudioData(buffer))

                        return [
                            id,
                            audioBuffer,
                        ]
                    }
                )
            )
            .flat()
        ))
        Object.entries(this.objects).forEach(([_id, obj]) => {
            (obj as EntrySprite).pixiSprite.texture = this.textures[obj.textureIds[obj.currentTextureIndex]]
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

        this.renderer = new WebGLRenderer()
        await this.renderer!.init({
            width: 480,
            height: 270,
            backgroundColor: "#fff",
            resolution: 4
        })

        const canvas = this.renderer!.canvas

        parent.appendChild(canvas)

        canvas.addEventListener("pointerdown", () => {
            this.isClicked = true
            this.emit("pointerdown")
        })
        canvas.addEventListener("pointerup", () => {
            this.isClicked = false
            this.emit("pointerup")
        })
        Object.values(this.scenes).map(scene => {
            scene.eventMode = "static"
            scene.addEventListener("globalpointermove", e => {
                this.mouse.x = e.globalX - 240
                this.mouse.y = 135 - e.globalY
            })
        })
        
        const loop = () => {
            this.render()
            requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
    }
    async emit(eventName: string) {
        if (!this.events[eventName]) {
            this.events[eventName] = []
        }
        await Promise.all(
            this.events[eventName]
                .map(f => f())
        )
    }
    on(eventName: string, f: () => Promise<void>) {
        if (!this.events[eventName]) {
            this.events[eventName] = []
        }
        this.events[eventName].push(f)
    }
    off(eventName: string, f: () => Promise<void>) {
        if (!this.events[eventName]) {
            return
        }
        const i = this.events[eventName].indexOf(f)
        this.events[eventName].splice(i, 1)
    }
    start() {
        this.emit(`run_scene_${this.currentScene.label}`)
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
    soundStart(soundId: string, offset?: number, duration?: number) {
        return new Promise(o => {
            const source = this.audioContext.createBufferSource()
            source.buffer = this.sounds[soundId]
            source.connect(this.gainNode)
            source.addEventListener("ended", o)
            source.start(
                this.audioContext.currentTime,
                offset,
                duration,
            )
        })
    }

    /* 글상자 */
    text_color(str: string) {
        return str
    }
    text_read(targetId: string, obj: EntryText) {
        const target =
            targetId == "self"
                ? obj
                : this.objects[targetId] as EntryText
        return target.text
    }
    text_write(str: string, obj: EntryText) {
        obj.text = str
    }
    text_append(str: string, obj: EntryText) {
        obj.text += str
    }
    text_prepend(str: string, obj: EntryText) {
        obj.text = str + obj.text
    }
    text_change_effect() {
        console.log("skip (todo):", "text_change_effect")
    }
    text_change_font() {
        console.log("skip (todo):", "text_change_font")
    }
    text_change_font_color(color: string, obj: EntryText) {
        obj.colour = color
    }
    text_change_bg_color() {
        console.log("skip (todo):", "text_change_bg_color")
    }
    text_flush(obj: EntryText) {
        obj.text = ""
    }

    /* 소리 */
    get_sounds(id: string) {
        return id
    }
    sound_something_with_block(soundId: string) {
        this.sound_something_wait_with_block(soundId)
    }
    sound_something_second_with_block(
        soundId: string,
        duration: number,
    ) {
        this.sound_something_second_wait_with_block(soundId, duration)
    }
    sound_from_to(
        soundId: string,
        from: number,
        to: number,
    ) {
        this.sound_from_to_and_wait(soundId, from, to)
    }
    async sound_something_wait_with_block(soundId: string) {
        await this.soundStart(soundId)
    }
    async sound_something_second_wait_with_block(
        soundId: string,
        duration: number,
    ) {
        await this.soundStart(
            soundId,
            0,
            duration,
        )
    }
    async sound_from_to_and_wait(
        soundId: string,
        from: number,
        to: number,
    ) {
        await this.soundStart(
            soundId,
            from,
            to - from,
        )
    }
    get_sound_duration(soundId: string) {
        return this.sounds[soundId].duration
    }
    get_sound_volume() {
        return this.volume
    }
    sound_volume_change(n: number) {
        this.sound_volume_set(this.volume + n)
    }
    sound_volume_set(n: number) {
        this.volume = Math.min(Math.max(0, n), 100)
    }
    play_bgm(soundId: string) {
        this.sound_something_with_block(soundId)
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
    show_variable() {
        console.log("skip:", "show_variable")
    }
    hide_variable() {
        console.log("skip:", "hide_variable")
    }
    value_of_index_from_list(id: string, i: number) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        return (this.variables[id] as (string | number)[])[i - 1]
    }
    add_value_to_list(value: string | number, id: string) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        return (this.variables[id] as (string | number)[]).push(value)
    }
    remove_value_from_list(i: number, id: string) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        (this.variables[id] as (string | number)[]).splice(i - 1, 1)
    }
    insert_value_to_list(
        value: string | number,
        id: string,
        i: number,
    ) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        (this.variables[id] as (string | number)[]).splice(i - 1, 0, value)
    }
    change_value_list_index(
        id: string,
        i: number,
        value: string | number,
    ) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        (this.variables[id] as (string | number)[])[i - 1] = value
    }
    length_of_list(id: string) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        return (this.variables[id] as (string | number)[]).length
    }
    is_included_in_list(id: string, value: string | number) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        return (this.variables[id] as (string | number)[]).includes(value)
    }
    show_list() {
        console.log("skip:", "show_list")
    }
    hide_list() {
        console.log("skip:", "hide_list")
    }
}