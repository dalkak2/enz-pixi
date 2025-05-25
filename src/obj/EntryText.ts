import { Text } from "../../deps/pixi.ts"
import type { EntryContainerData } from "./EntryContainer.ts"
import { EntryBrush } from "./EntryBrush.ts"

export interface EntryTextData extends EntryContainerData {
    font: string
    colour: string
    text: string
    textAlign: 0 | 1 | 2
    lineBreak: boolean
    bgColor: string
    underLine: boolean
    strike: boolean
    fontSize: number
}

export class EntryText extends EntryBrush {
    
    declare pixiSprite: Text

    font
    lineBreak
    bgColor
    underLine
    strike

    get text() { return this.pixiSprite.text }
    set text(text: string) { this.pixiSprite.text = text }

    _colour: string = "black"
    get colour() {
        return this._colour
    }
    set colour(colour: string) {
        this.pixiSprite.style.fill = colour
    }

    get textAlign() {
        return ({
            center: 0,
            left: 1,
            right: 2,
        } as const)[this.pixiSprite.style.align as "center" | "left" | "right"]
    }
    set textAlign(i: 0 | 1 | 2) {
        this.pixiSprite.style.align = ([
            "center",
            "left",
            "right",
        ] as const)[i]
    }
    
    get fontSize() { return this.pixiSprite.style.fontSize }
    set fontSize(fontSize: number) { this.pixiSprite.style.fontSize = fontSize }

    constructor(data: EntryTextData) {
        super(data)
        this.font = data.font
        this.colour = data.colour
        this.text = data.text
        this.textAlign = data.textAlign
        this.lineBreak = data.lineBreak
        this.bgColor = data.bgColor
        this.underLine = data.underLine
        this.strike = data.strike
        this.fontSize = data.fontSize

        if (data.lineBreak) {
            this.pixiSprite.anchor.set(0.5)
        } else {
            this.pixiSprite.anchor.set([
                0.5, // center
                0,   // left
                1,   // right
            ][this.textAlign], 0.5)
        }
    }

    override cloneGetters() {
        return {
            ...super.cloneGetters(),
            text: this.text,
            colour: this.colour,
            textAlign: this.textAlign,
            fontSize: this.fontSize,
        }
    }

    init() {
        this.pixiSprite = new Text({
            renderMode: "html",
        })
    }
}