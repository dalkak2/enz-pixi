export const wait_second =
    (sec: number) =>
        new Promise(o => {
            setTimeout(o, sec * 1000)
        })

export const toRadian =
    (deg: number) =>
        deg * Math.PI / 180

export const toDegrees =
    (rad: number) =>
        rad * 180 / Math.PI

export const mod =
    (a: number, n: number) =>
        ((a % n) + n) % n

export const numberNormalize =
    // TODO: convert in server
    (numOrStr: number | string): number | string =>
        Number.isNaN(Number(numOrStr))
            ? numOrStr as string
            : Number(numOrStr) as number
