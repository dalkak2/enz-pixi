import type { Object_ } from "../../deps/enz.ts"
import {
    EventEmitter,
    Container,
} from "../../deps/pixi.ts"
import type { Entry } from "../EntryState.ts"

export interface EntryContainerData {
    x: number
    y: number
    rotation: number
    direction: number
    size: number
    visible: boolean
    transparency: number
    currentTextureIndex: number
    isClone: boolean

    id: string
    name: string
    scene: string
    objectType: string
    textureIds: string[]
}

export abstract class EntryContainer extends EventEmitter {
    direction: number
    currentTextureIndex: number
    isClone: boolean

    id: string
    name: string
    scene: string
    objectType: string
    textureIds: string[]

    parent?: EntryContainer
    children: EntryContainer[] = []

    abstract pixiSprite: Container

    constructor(data: EntryContainerData) {
        super()
        this.init()
        this.x = data.x
        this.y = data.y
        this.rotation = data.rotation
        this.direction = data.direction
        this.size = data.size*0.1
        this.visible = data.visible
        this.transparency = data.transparency
        this.currentTextureIndex = data.currentTextureIndex
        this.isClone = data.isClone

        this.id = data.id
        this.name = data.name
        this.scene = data.scene
        this.objectType = data.objectType
        this.textureIds = data.textureIds
    }

    /** Initialize this.pixiSprite */
    abstract init(): void

    get size() {
        return (this.pixiSprite.width + this.pixiSprite.height) / 2
    }
    set size(newSize: number) {
        const scale = Math.max(1, newSize) / this.size
        this.pixiSprite.scale.x *= scale
        this.pixiSprite.scale.y *= scale
    }
    get x() {
        return this.pixiSprite.x - 240
    }
    set x(x: number) {
        this.pixiSprite.x = x + 240
    }
    get y() {
        return -this.pixiSprite.y + 135
    }
    set y(y: number) {
        this.pixiSprite.y = -y + 135
    }
    get rotation() { return this.pixiSprite.angle }
    set rotation(a: number) { this.pixiSprite.angle = a }
    get visible() { return this.pixiSprite.visible }
    set visible(b: boolean) { this.pixiSprite.visible = b }
    get transparency() {
        return (1 - this.pixiSprite.alpha) * 100
    }
    set transparency(n: number) {
        this.pixiSprite.alpha = 1 - (n / 100)
    }

    _isClicked?: boolean
    get isClicked() {
        if (typeof this._isClicked == "undefined") {
            this.setEventMode("static")
            this.pixiSprite.on("pointerdown", () => {
                this._isClicked = true
            })
            this.pixiSprite.on("pointerup", () => {
                this._isClicked = false
            })
            this._isClicked = false
        }
        return this._isClicked
    }
    
    _isTouched?: boolean
    get isTouched() {
        if (typeof this._isTouched == "undefined") {
            this.setEventMode("static")
            this.pixiSprite.on("pointerenter", () => {
                this._isTouched = true
            })
            this.pixiSprite.on("pointerleave", () => {
                this._isTouched = false
            })
            this._isTouched = false
        }
        return this._isTouched
    }

    destroy() {
        this.pixiSprite.destroy()
        this.removeAllListeners()
    }

    static fromEntryData(
        {
            id,
            name,
            selectedPictureId,
            scene,
            entity,
            sprite: {
                pictures,
                // sounds,
            },
            objectType,
        }: Object_,
        project: Entry,
    ) {
        const textureIds = pictures.map(
            ({id}) => id
        )
        const sprite = new (this as unknown as new (data: EntryContainerData) => EntryContainer)({
            ...entity,
            id,
            name,
            size: (entity.width + entity.height) / 2,
            textureIds,
            currentTextureIndex: textureIds.indexOf(selectedPictureId),
            transparency: 0,
            isClone: false,
            scene,
            objectType,
        })
        const pixiSprite = sprite.pixiSprite
        pixiSprite.scale.x = entity.scaleX
        pixiSprite.scale.y = entity.scaleY
        project.scenes[sprite.scene].addChildAt(pixiSprite, 0)

        return sprite
    }

    /**
     * Subclass state cloner
     */
    protected dataUpdate(_sprite: this) {}

    cloneGetters() {
        return {
            size: this.size,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            visible: this.visible,
            transparency: this.transparency,
        }
    }

    clone(project: Entry) {
        const sprite = new (this.constructor as new (data: EntryContainerData) => this)({
            ...this,
            ...this.cloneGetters(),

            isClone: true,
        })
        const pixiSprite = sprite.pixiSprite

        pixiSprite.scale = this.pixiSprite.scale

        this.dataUpdate(sprite)

        ;(sprite.parent = this.parent || this).children.push(sprite)

        this.addSibling(project, sprite.pixiSprite, 0)
        
        sprite.emit("clone")

        return sprite
    }
    /**
     * @param project 
     * @param target 
     * @param relativePos 0: Back
     */
    addSibling(
        project: Entry,
        target: Container,
        relativePos: number
    ) {
        const scene = project.scenes[this.scene]
        const myPos = scene.children.findIndex(x => x == this.pixiSprite)
        scene.addChildAt(target, myPos + relativePos)
    }
    setEventMode(eventMode: "static" | "dynamic") {
        if (this.pixiSprite.eventMode == "dynamic") {
            return
        }
        this.pixiSprite.eventMode = eventMode
    }
}