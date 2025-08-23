import {
    Start,
    Flow,
    Movement,
} from "./block/mod.ts"
import { Module } from "./Module.ts"

// deno-lint-ignore no-explicit-any
type Args<C extends { new(...args: any): any }> =
C extends { new(...args: infer Args): infer _ }
    ? Args
    : never

export interface Entry extends
    Start,
    Flow
{
    modules: (typeof Module)[]
}

export const Entry = function (this: Entry, ...args: Args<typeof Module>) {
    Object.assign(
        this,
        new Module(...args),
    )
    this.modules = [
        Start,
        Flow,
        Movement,

        Module,
    ]
    this.modules.forEach(module => {
        Object.defineProperties(
            this,
            Object.getOwnPropertyDescriptors(module.prototype),
        )
    })
} as unknown as { new(...args: Args<typeof Module>): Entry }
