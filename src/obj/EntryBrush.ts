import { EntryContainer } from "./EntryContainer.ts"
import {
    Graphics,
    Color,
    type Container,
} from "../../deps/pixi.ts"
import type { Entry } from "../Entry.ts"

export abstract class EntryBrush extends EntryContainer {
    protected dataUpdate(sprite: this): void {
        sprite._strokeColor = this._strokeColor
        sprite._strokeThickness = this._strokeThickness
    }

    hasBrush = false
    _brushGraphics?: Graphics
    _lineListener?: () => void
    getBrush(onGraphicsInit?: (graphics: Graphics) => void) {
        if (!this._brushGraphics) {
            this._brushGraphics = new Graphics()
            this.strokeColor = this.strokeColor
            this.strokeThickness = this.strokeThickness
            this.brushTransparency = this.brushTransparency

            this._lineListener = () => {
                this._brushGraphics!.lineTo(
                    this.pixiSprite.x,
                    this.pixiSprite.y,
                )
                this._brushGraphics!.stroke()
            }
            onGraphicsInit?.(this._brushGraphics)
        }
        return {
            graphics: this._brushGraphics!,
            lineListener: this._lineListener!,
        }
    }

    _strokeColor?: string
    get strokeColor() {
        return this._strokeColor || "red"
    }
    set strokeColor(color: string) {
        this._strokeColor = color
        /*
            https://github.com/pixijs/pixijs/blob/v8.0.0-beta.11/src/scene/graphics/shared/utils/convertFillInputToFillStyle.ts#L92
        */
        if (this._brushGraphics) {
            this._brushGraphics.strokeStyle.color = Color.shared.setValue(color).toNumber()
        }
    }

    _strokeThickness?: number
    get strokeThickness() {
        return this._strokeThickness || 1
    }
    set strokeThickness(n: number) {
        this._strokeThickness = n
        if (this._brushGraphics) {
            this._brushGraphics.strokeStyle.width = n
        }
    }
    
    _brushTransparency?: number
    get brushTransparency() {
        return this._brushTransparency || 0
    }
    set brushTransparency(n: number) {
        this._brushTransparency = n
        if (this._brushGraphics) {
            this._brushGraphics.alpha = 1 - n / 100
        }
    }
    addSibling(
        project: Entry,
        target: Container,
        relativePos: number
    ) {
        const scene = project.scenes[this.scene]
        const myPos = scene.children.findIndex(x => x == this.pixiSprite)
        scene.addChildAt(
            target,
            myPos
                + relativePos
                + (this.hasBrush ? -1 : 0)
        )
    }
}