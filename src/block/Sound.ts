import { Module } from "../Module.ts"

export class Sound extends Module {
    get_sounds(id: string) {
        return id
    }
    sound_something_with_block(soundId: string) {
        this.sound_something_wait_with_block(soundId)
    }
    sound_something_second_with_block(
        soundId: string,
        duration: number,
    ) {
        this.sound_something_second_wait_with_block(soundId, duration)
    }
    sound_from_to(
        soundId: string,
        from: number,
        to: number,
    ) {
        this.sound_from_to_and_wait(soundId, from, to)
    }
    async sound_something_wait_with_block(soundId: string) {
        await this.soundStart(soundId)
    }
    async sound_something_second_wait_with_block(
        soundId: string,
        duration: number,
    ) {
        await this.soundStart(
            soundId,
            0,
            duration,
        )
    }
    async sound_from_to_and_wait(
        soundId: string,
        from: number,
        to: number,
    ) {
        await this.soundStart(
            soundId,
            from,
            to - from,
        )
    }
    get_sound_duration(soundId: string) {
        return this.sounds[soundId].duration
    }
    get_sound_volume() {
        return this.volume
    }
    sound_volume_change(n: number) {
        this.sound_volume_set(this.volume + n)
    }
    sound_volume_set(n: number) {
        this.volume = Math.min(Math.max(0, n), 100)
    }
    play_bgm(soundId: string) {
        this.sound_something_with_block(soundId)
    }
}
