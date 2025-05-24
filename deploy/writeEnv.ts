import { stringify } from "https://deno.land/std@0.210.0/dotenv/mod.ts"

const writeEnv = async (env: Record<string, string>) => {
    console.log(env)
    await Deno.writeTextFile(".env", stringify(env))
}

const {
    hash,
    tag,
    branch,
    trigger,
} = Deno.env.toObject()

await writeEnv({
    hash,
    tag,
    branch,
    trigger,
})
