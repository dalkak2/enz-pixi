import { stringify } from "https://deno.land/std@0.210.0/dotenv/mod.ts"

const [ VERSION_LABEL ] = Deno.args

const writeEnv = async (env: Record<string, string>) => {
    await Deno.writeTextFile(".env", stringify(env))
}

await writeEnv({
    VERSION_LABEL: VERSION_LABEL.slice(0, 7),
})
