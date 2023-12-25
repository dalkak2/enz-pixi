import { Sprite } from "../../deps/pixi.ts"
import { EntryContainer } from "./EntryContainer.ts"
import type { Entry } from "../Entry.ts"

export class EntrySprite extends EntryContainer {

    declare pixiSprite: Sprite

    init() {
        this.pixiSprite = new Sprite()
        this.pixiSprite.anchor.set(0.5)
    }
    clone(project: Entry) {
        const sprite = super.clone(project)
        sprite.pixiSprite.texture = this.pixiSprite.texture
        return sprite
    }
}