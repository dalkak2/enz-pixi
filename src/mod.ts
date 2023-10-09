import { Project } from "../deps/enz.ts"
import { Ticker } from "../deps/pixi.ts"

export const init =
    (project: Project) =>
        new Entry(project)

export class Entry {
    project
    events: Record<string, (() => void)[]>
    constructor(project: Project) {
        this.project = project
        this.events = {
            start: []
        }
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