import * as resvg from "https://esm.sh/v135/@resvg/resvg-wasm@2.6.0"

await resvg.initWasm(fetch("https://esm.sh/v135/@resvg/resvg-wasm@2.6.0/index_bg.wasm"))

export const svgToPng =
    (svg: string) => {
        const resvgJS = new resvg.Resvg(svg, {})
        const pngData = resvgJS.render()
        const pngBuffer = pngData.asPng()
        return pngBuffer
    }

export const image =
    async (path: string) => {
        if (path.endsWith(".svg.png")) {
            path = path.slice(0, -4)
            return await fetch(path).then(async res => {
                return svgToPng(await res.text())
            })
        } else {
            return await fetch(path).then(res => res.body)
        }
    }