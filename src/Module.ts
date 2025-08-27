import type { Project } from "../deps/enz.ts"
import {
    WebGLRenderer,
    Renderer,
    Container,
} from "../deps/pixi.ts"

import {
    EntryContainer,
} from "./obj/mod.ts"

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

export const mod =
    (a: number, n: number) =>
        ((a % n) + n) % n

export class Module {
    project!: Project
    renderer?: Renderer

    events: Record<string, (() => Promise<void>)[]> = {}
    scenes: Record<string, Container> = {}
    objects: Record<string, EntryContainer> = {}

    currentScene!: Container

    // Used in: Judgement
    // Keep here cause "pointerdown" event used in Start
    // todo: make it coherent with "keydown"
    isClicked = false

    // Used in: Calc, Moving
    mouse = {
        x: 0,
        y: 0,
    }

    loadProject(project: Project) {
        this.project = project

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
    // deno-lint-ignore no-unused-vars
    async init(parent: HTMLElement) {
        // default - do nothing
    }
    // todo: refactor
    async defaultInit(parent: HTMLElement) {
        if (!this.project) {
            throw new Error("Module.init() is called before Module.loadProject()")
        }

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
}