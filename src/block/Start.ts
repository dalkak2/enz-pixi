import { Module } from "../Module.ts"
import { EntryContainer } from "../obj/mod.ts"

const onAndTrackDestroy = (
    eventEmitter: {
        on: (eventName: string, f: () => Promise<void>) => void,
        off: (eventName: string, f: () => Promise<void>) => void,
    },
    eventName: string,
    f: () => Promise<void>,
    obj: EntryContainer,
) => {
    const ef = async () => {
        if (obj.pixiSprite.destroyed) {
            eventEmitter.off(eventName, ef)
            return
        }
        await f().catch((e: Error) => {
            if (!obj.pixiSprite.destroyed) {
                throw e
            }
            eventEmitter.off(eventName, ef)
        })
    }
    eventEmitter.on(eventName, ef)
}

export class Start extends Module {
        when_run_button_click(
            f: () => Promise<void>,
            obj: EntryContainer,
        ) {
            this.on(`run_scene_${obj.scene}`, f)
        }
        when_some_key_pressed(keyCode: string, f: () => Promise<void>) {
            document.body.addEventListener("keydown", e => {
                if (e.keyCode == Number(keyCode)) {
                    f()
                }
            })
        }
        mouse_clicked(f: () => Promise<void>, obj: EntryContainer) {
            onAndTrackDestroy(this, "pointerdown", f, obj)
        }
        mouse_click_cancled(f: () => Promise<void>, obj: EntryContainer) {
            onAndTrackDestroy(this, "pointerup", f, obj)
        }
        when_object_click(f: () => Promise<void>, obj: EntryContainer) {
            obj.setEventMode("static")
            onAndTrackDestroy(obj.pixiSprite, "pointerdown", f, obj)
        }
        when_object_click_canceled(f: () => Promise<void>, obj: EntryContainer) {
            obj.setEventMode("static")
            onAndTrackDestroy(obj.pixiSprite, "pointerup", f, obj)
        }
        when_message_cast(
            messageId: string,
            f: () => Promise<void>,
            obj: EntryContainer,
        ) {
            onAndTrackDestroy(this, `message_${messageId}`, f, obj)
        }
        message_cast(messageId: string) {
            this.emit(`message_${messageId}`)
        }
        async message_cast_wait(messageId: string) {
            await this.emit(`message_${messageId}`)
        }
        when_scene_start(f: () => Promise<void>, obj: EntryContainer) {
            this.on(`start_scene_${obj.scene}`, f)
        }
        start_scene(sceneId: string) {
            this.currentScene = this.scenes[sceneId]
            this.emit(`start_scene_${sceneId}`)
        }
        start_neighbor_scene(type: "prev" | "next") {
            const currentSceneIndex = Object.values(this.scenes).findIndex(scene => scene == this.currentScene)
            if (type == "prev") {
                this.currentScene = Object.values(this.scenes)[currentSceneIndex - 1]
            }
            if (type == "next") {
                this.currentScene = Object.values(this.scenes)[currentSceneIndex + 1]
            }
            this.emit(`start_scene_${this.currentScene.label}`)
        }
}
