import { Project } from "../deps/enz.ts"
import {
    Ticker,
    autoDetectRenderer,
    Renderer,
    Sprite,
    Container,
    Assets,
} from "../deps/pixi.ts"

export const init =
    (project: Project) =>
        new Entry(project)

export class Entry {
    project
    renderer?: Renderer
    events: Record<string, (() => void)[]>
    constructor(project: Project) {
        this.project = project
        this.events = {
            start: []
        }
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
            }
        )
        ticker.start()
    }
    move_direction(n: number, obj: string) {
    }
}