import { EntryContainer } from "./EntryContainer.ts"
import {
    Graphics,
    type Container,
} from "../../deps/pixi.ts"
import type { Module } from "../Module.ts"

export abstract class EntryBrush extends EntryContainer {
    protected override dataUpdate(sprite: this): void {
        sprite.strokeColor = this.strokeColor
        sprite.strokeThickness = this.strokeThickness
        sprite.brushTransparency = this.brushTransparency
    }

    hasStrokeBrush = false
    _strokeBrush?: Graphics
    _lineListener?: () => void
    getStrokeBrush(onGraphicsInit?: (graphics: Graphics) => void) {
        if (!this._strokeBrush) {
            this._strokeBrush = new Graphics()

            this._lineListener = () => {
                this._strokeBrush!.lineTo(
                    this.pixiSprite.x,
                    this.pixiSprite.y,
                )
                this._strokeBrush!.stroke({
                    width: this.strokeThickness,
                    color: this.strokeColor,
                    alpha: 1 - this.brushTransparency / 100,
                })
            }
            onGraphicsInit?.(this._strokeBrush)
        }
        return {
            graphics: this._strokeBrush!,
            lineListener: this._lineListener!,
        }
    }

    strokeColor = "red"
    strokeThickness = 1
    brushTransparency = 0

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