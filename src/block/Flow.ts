import { Module } from "../Module.ts"
import { wait_second } from "../util/basic.ts"
import { EntryContainer } from "../obj/mod.ts"

export class Flow extends Module {
    async wait_second(sec: number) {
        await wait_second(sec)
    }
    /*
        These blocks are transpiled from server.
        Check ../api/js.ts
        ```
        repeat_basic
        repeat_inf
        repeat_while_true
        stop_repeat
        _if
        if_else
        wait_until_true
        ```
    */
    create_clone(targetId: string, obj: EntryContainer) {
        const target =
            targetId == "self"
                ? obj
                : this.objects[targetId]
        
        target.clone(this).emit("clone")
    }
    when_clone_start(f: () => Promise<void>, obj: EntryContainer) {
        obj.on("clone", () => f().catch((e: Error) => {
            if (!obj.pixiSprite.destroyed) {
                throw e
            }
        }))
    }
    delete_clone(obj: EntryContainer) {
        if (obj.isClone) {
            obj.destroy()
        }
    }
    remove_all_clones(obj: EntryContainer) {
        obj.children.forEach(child => {
            child.destroy()
        })
        obj.children = []
    }
}
