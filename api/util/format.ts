import {
    createStreaming,
    GlobalConfiguration,
} from "https://deno.land/x/dprint@0.2.0/mod.ts"

const globalConfig: GlobalConfiguration = {
    indentWidth: 2,
    lineWidth: 80,
}

const tsFormatter = await createStreaming(
    fetch("https://plugins.dprint.dev/typescript-0.88.6.wasm")
)

tsFormatter.setConfig(globalConfig, {
    semiColons: "asi",
})

export const format =
    (src: string) =>
        tsFormatter.formatText("0.js", src)