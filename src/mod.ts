import { Project } from "../deps/enz.ts"
import {
    Ticker,
    autoDetectRenderer,
    Renderer,
    Sprite,
    Container,
    Assets,
    Texture,
} from "https://esm.sh/v132/pixi.js@8.0.0-beta.5"

export const init =
    (project: Project) =>
        new Entry(project)

export class Entry {
    project
    renderer?: Renderer
    events: Record<string, (() => void)[]>
    scenes: Record<string, Container> = {}
    textures: Record<string, Texture> = {}
    objects: Record<string, Sprite> = {}
    constructor(project: Project) {
        this.project = project
        this.events = {
            start: []
        }
    }
    async init() {
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
            this.project.objects.map(
                ({id, selectedPictureId, scene, entity}) => {
                    console.log(selectedPictureId)
                    const sprite = Sprite.from(
                        this.textures[selectedPictureId]
                    )
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
        console.log("Init")
        // @ts-ignore: Unknown error???
        return this.renderer = await autoDetectRenderer({
            width: 480,
            height: 270,
            backgroundColor: "#fff",
            resolution: 4
        })
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

    wait_second(sec: number) {
        this.render()
        return new Promise(o => {
            setTimeout(o, sec * 1000)
        })
    }
    when_run_button_click(f: () => void) {
        this.on("start", f)
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
    move_x(n: number, id: string) {
        this.objects[id].x += n
    }
    move_y(n: number, id: string) {
        this.objects[id].y += n
    }
    locate_xy(x: number, y: number, id: string) {
        this.objects[id].x = x + 240
        this.objects[id].y = -y + 135
    }
    calc_rand(a: number, b: number) {
        return Math.random() * (b - a) + a
    }
}