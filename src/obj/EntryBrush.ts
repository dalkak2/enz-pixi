// deno-lint-ignore-file no-self-assign

import { EntryContainer } from "./EntryContainer.ts"
import {
    Graphics,
    Color,
    type Container,
} from "../../deps/pixi.ts"
import type { Module } from "../Module.ts"

export abstract class EntryBrush extends EntryContainer {
    protected override dataUpdate(sprite: this): void {
        sprite._strokeColor = this._strokeColor
        sprite._strokeThickness = this._strokeThickness
        sprite._brushTransparency = this._brushTransparency
    }

    hasStrokeBrush = false
    _strokeBrush?: Graphics
    _lineListener?: () => void
    getStrokeBrush(onGraphicsInit?: (graphics: Graphics) => void) {
        if (!this._strokeBrush) {
            this._strokeBrush = new Graphics()
            this.strokeColor = this.strokeColor
            this.strokeThickness = this.strokeThickness
            this.brushTransparency = this.brushTransparency

            this._lineListener = () => {
                this._strokeBrush!.lineTo(
                    this.pixiSprite.x,
                    this.pixiSprite.y,
                )
                this._strokeBrush!.stroke()
            }
            onGraphicsInit?.(this._strokeBrush)
        }
        return {
            graphics: this._strokeBrush!,
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
        if (this._strokeBrush) {
            this._strokeBrush.strokeStyle.color = Color.shared.setValue(color).toNumber()
        }
    }

    _strokeThickness?: number
    get strokeThickness() {
        return this._strokeThickness || 1
    }
    set strokeThickness(n: number) {
        this._strokeThickness = n
        if (this._strokeBrush) {
            this._strokeBrush.strokeStyle.width = n
        }
    }
    
    _brushTransparency?: number
    get brushTransparency() {
        return this._brushTransparency || 0
    }
    set brushTransparency(n: number) {
        this._brushTransparency = n
        if (this._strokeBrush) {
            this._strokeBrush.alpha = 1 - n / 100
        }
    }
    override addSibling(
        project: Module,
        target: Container,
        relativePos: number
    ) {
        const scene = project.scenes[this.scene]
        const myPos = scene.children.findIndex(x => x == this.pixiSprite)
        scene.addChildAt(
            target,
            myPos
                + relativePos
                + (this.hasStrokeBrush ? -1 : 0)
        )
    }
}