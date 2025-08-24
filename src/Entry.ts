import * as Block from "./block/mod.ts"
import { Module } from "./Module.ts"

// deno-lint-ignore no-explicit-any
type Args<C extends { new(...args: any): any }> =
    C extends { new(...args: infer Args): infer _ }
        ? Args
        : never

type UnionToIntersection<T> =
    (
        T extends infer _ ? (x: T) => void : never
    ) extends (x: infer R) => void
        ? R
        : never

type StdModule = UnionToIntersection<
    (typeof Block)[
        keyof typeof Block
    ] extends { new(...args: infer _): infer I }
        ? I
        : never
>

type Entry = StdModule & {
    modules: (typeof Module)[]
}

export const Entry = function (this: Entry, ...args: Args<typeof Module>) {
    Object.assign(
        this,
        new Module(...args),
    )
    this.modules = [
        ...Object.values(Block),
        Module,
    ]
    this.modules.forEach(module => {
        Object.defineProperties(
            this,
            Object.getOwnPropertyDescriptors(module.prototype),
        )
    })
} as unknown as { new(...args: Args<typeof Module>): Entry }
