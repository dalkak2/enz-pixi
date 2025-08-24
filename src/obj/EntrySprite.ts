import { Sprite } from "../../deps/pixi.ts"
import { EntryBrush } from "./EntryBrush.ts"
import type { Module } from "../Module.ts"

export class EntrySprite extends EntryBrush {

    declare pixiSprite: Sprite

    init() {
        this.pixiSprite = new Sprite()
        this.pixiSprite.anchor.set(0.5)
    }
    override clone(project: Module) {
        const sprite = super.clone(project)
        sprite.pixiSprite.texture = this.pixiSprite.texture
        return sprite
    }
}