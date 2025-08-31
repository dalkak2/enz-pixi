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

type Entry = StdModule & GlobalModule

class GlobalModule extends Module {
    modules: (typeof Module)[] = [
        ...Object.values(Block),
        Module,
    ]
    moduleInstances: Map<typeof Module, Module> =
        new Map(this.modules.map(module => [module, new module()]))

    assignModulesMixin(o: object) {
        this.modules.forEach(module => {
            Object.defineProperties(
                this,
                Object.getOwnPropertyDescriptors(module.prototype),
            )
        })
        this.moduleInstances.forEach(instance => {
            Object.assign(o, instance)
        })
    }
}

export const Entry = function (this: Entry, ...args: Args<typeof Module>) {
    Object.assign(this, new Module(...args))
    Object.assign(this, new GlobalModule(...args))
    Object.defineProperties(
        this,
        Object.getOwnPropertyDescriptors(GlobalModule.prototype),
    )
    this.assignModulesMixin(this)

    // @ts-expect-error:
    this.init = async (canvas: HTMLCanvasElement) => {
        await this.defaultInit(canvas)
        await Promise.all(
            this.modules.map(module =>
                this.moduleInstances.get(module)!.init.call(this)
            )
        )
    }

} as unknown as { new(...args: Args<typeof Module>): Entry }
