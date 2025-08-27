import { EntryContainer } from "./EntryContainer.ts"
import {
    Graphics,
    StrokeInstruction,
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

    _strokeInst?: StrokeInstruction

    getStrokeBrush(onGraphicsInit?: (graphics: Graphics) => void) {
        if (!this._strokeBrush) {
            this._strokeBrush = new Graphics()

            this._lineListener = () => {
                // todo: should use public method when pixi make it
                this._strokeInst!.data.path.lineTo(
                    this.pixiSprite.x,
                    this.pixiSprite.y,
                )
                // @ts-expect-error:
                this._strokeBrush!.context.onUpdate()
                // @ts-expect-error:
                this._strokeBrush!.context._tick = 0
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

    pushStrokeInst() {
        (this._strokeBrush ||= new Graphics).moveTo(
            this.pixiSprite.x,
            this.pixiSprite.y,
        )
        this._strokeBrush!.stroke({
            width: this.strokeThickness,
            color: this.strokeColor,
            alpha: 1 - this.brushTransparency / 100,
        })

        const insts = this._strokeBrush!.context.instructions
        this._strokeInst = insts[insts.length-1] as StrokeInstruction
    }
    start_drawing(project: Module) {
        const { lineListener } = this.getStrokeBrush(graphics => {
            this.addSibling(project, graphics, 0)
            this.hasStrokeBrush = true
        })

        this.pushStrokeInst()

        this.on("move", lineListener)
    }
    stop_drawing() {
        if (this._lineListener) {
            this.off("move", this._lineListener)
        }
    }
}