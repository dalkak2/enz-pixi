import { Project } from "../deps/enz.ts"
import {
    Ticker,
    autoDetectRenderer,
    Renderer,
    Sprite,
    Container,
    Assets,
    Texture,
} from "../deps/pixi.ts"

export const init =
    (project: Project) =>
        new Entry(project)

export class Entry {
    project
    renderer?: Renderer
    events: Record<string, (() => void)[]>
    scenes: Record<string, Container>
    textures: Record<string, Texture>
    objects: Record<string, Sprite>
    constructor(project: Project) {
        this.project = project
        this.events = {
            start: []
        }

        this.scenes = Object.fromEntries(
            project.scenes.map(
                ({id}) => [id, new Container()]
            )
        )
        this.textures = Object.fromEntries(
            project.objects.map(({sprite}) =>
                sprite.pictures.map(
                    ({id, fileurl}) => {
                        const texture = Texture.from(fileurl)
                        return [
                            id,
                            texture,
                        ]
                    }
                )
            )
            .flat()
        )
        this.objects = Object.fromEntries(
            project.objects.map(
                ({id, selectedPictureId, scene}) => {
                    const sprite = Sprite.from(
                        this.textures[selectedPictureId]
                    )
                    this.scenes[scene].addChild(sprite)
                    return [
                        id,
                        sprite,
                    ]
                }
            )
        )
    }
    async init() {
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
        this.renderer!.render({
            container: Object.values(this.scenes)[0]
        })
    }

    when_run_button_click(f: () => void) {
        this.on("start", f)
    }
    repeat_basic(n: number, f: () => void) {
        const ticker = new Ticker
        let i = 0
        ticker.add(
            () => {
                if (++i > n) {
                    ticker.destroy()
                    return
                }
                f()
                this.render()
            }
        )
        ticker.start()
    }
    move_direction(n: number, obj: string) {
    }
}