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
    EntrySprite,
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