import {
    createStreaming,
    GlobalConfiguration,
} from "https://esm.sh/jsr/@dprint/formatter@0.4.1"

const globalConfig: GlobalConfiguration = {
    indentWidth: 2,
    lineWidth: 80,
}

const tsFormatter = await createStreaming(
    fetch("https://plugins.dprint.dev/typescript-0.95.10.wasm")
)

tsFormatter.setConfig(globalConfig, {
    semiColons: "asi",
})

export const format =
    (src: string) =>
        tsFormatter.formatText({
            filePath: "0.js",
            fileText: src,
        })