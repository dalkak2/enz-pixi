import {
    Start,
    Flow,
} from "./block/mod.ts"
import { Entry } from "./Entry.ts"

export interface Entry_ extends
    Start,
    Flow,
    Entry
{}

// deno-lint-ignore no-explicit-any
type Args<Class extends { new(...args: any): any }> =
Class extends { new(...args: infer Args): infer _ }
    ? Args
    : never

function Entry_(...args: Args<typeof Entry>) {
    Entry.constructor(...args)
}
