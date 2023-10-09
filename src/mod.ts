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

    when_run_button_click(f: () => void) {
        this.on("start", f)
    }
    repeat_inf(f: (ticker: Ticker) => void) {
        const ticker = new Ticker
        ticker.add(ticker => {
            f(ticker)
            this.render()
        })
        ticker.start()
    }
    repeat_basic(n: number, f: () => void) {
        let i = 0
        this.repeat_inf(ticker => {
            if (++i > n) {
                ticker.destroy()
                return
            }
            f()
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