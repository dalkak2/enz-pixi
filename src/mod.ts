import { Project } from "../deps/enz.ts"
import {} from "../deps/pixi.ts"

export const init =
    (project: Project) =>
        new Entry(project)

export class Entry {
    project
    constructor(project: Project) {
        this.project = project
    }
    when_run_button_click(a:any) {
        console.log(this.project)
    }
}