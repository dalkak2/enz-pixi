import { EntryContainer } from "./EntryContainer.ts"
import {
    Graphics,
    StrokeInstruction,
    FillInstruction,
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
    _graphics?: Graphics

    _strokeListener?: () => void
    _fillListener?: () => void

    _strokeInst?: StrokeInstruction
    _fillInst?: FillInstruction

    getGraphics() {
        if (!this._graphics) {
            this._graphics = new Graphics()

            this._strokeListener = () => {
                // todo: should use public method when pixi make it
                this._strokeInst!.data.path.lineTo(
                    this.pixiSprite.x,
                    this.pixiSprite.y,
                )
                // @ts-expect-error:
                this._graphics!.context.onUpdate()
                // @ts-expect-error:
                this._graphics!.context._tick = 0
            }
            this._fillListener = () => {
                // todo: should use public method when pixi make it
                this._fillInst!.data.path.lineTo(
                    this.pixiSprite.x,
                    this.pixiSprite.y,
                )
                // @ts-expect-error:
                this._graphics!.context.onUpdate()
                // @ts-expect-error:
                this._graphics!.context._tick = 0
            }
        }
        return {
            graphics: this._graphics!,
            strokeListener: this._strokeListener!,
            fillListener: this._fillListener!,
        }
    }

    strokeColor = "red"
    fillColor = "red"
    strokeThickness = 1
    brushTransparency = 0

    isGraphicsRegistered = false

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
        this.getGraphics()
        this._graphics!.moveTo(
            this.pixiSprite.x,
            this.pixiSprite.y,
        )
        this._graphics!.stroke({
            width: this.strokeThickness,
            color: this.strokeColor,
            alpha: 1 - this.brushTransparency / 100,
        })

        const insts = this._graphics!.context.instructions
        this._strokeInst = insts[insts.length-1] as StrokeInstruction
    }
    pushFillInst() {
        this.getGraphics()
        this._graphics!.moveTo(
            this.pixiSprite.x,
            this.pixiSprite.y,
        )
        this._graphics!.fill({
            color: this.fillColor,
            alpha: 1 - this.brushTransparency / 100,
        })

        const insts = this._graphics!.context.instructions
        this._fillInst = insts[insts.length-1] as FillInstruction
    }

    start_drawing(project: Module) {
        const { graphics, strokeListener } = this.getGraphics()

        if (!this.isGraphicsRegistered) {
            this.addSibling(project, graphics, 0)
            this.hasStrokeBrush = true
            this.isGraphicsRegistered = true
        }

        this.pushStrokeInst()

        this.on("move", strokeListener)
    }
    stop_drawing() {
        if (this._strokeListener) {
            this.off("move", this._strokeListener)
        }
    }
    start_fill(project: Module) {
        const { graphics, fillListener } = this.getGraphics()

        if (!this.isGraphicsRegistered) {
            this.addSibling(project, graphics, 0)
            // todo: is this needed?
            // this.hasFillBrush = true
            this.isGraphicsRegistered = true
        }

        this.pushFillInst()

        this.on("move", fillListener)
    }
    stop_fill() {
        if (this._fillListener) {
            this.off("move", this._fillListener)
        }
    }
    brush_erase_all() {
        this._graphics?.destroy()
        delete this._graphics
        this.hasStrokeBrush = false
        this.isGraphicsRegistered = false
        this.stop_drawing()
        this.stop_fill()
    }
    override destroy() {
        super.destroy()
        this.brush_erase_all()
    }
}