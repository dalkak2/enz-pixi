import { wrapFetch } from "https://deno.land/x/another_cookiejar@v5.0.3/mod.ts"

const fetch = wrapFetch()

export async function getCSRFToken() {
    const body = await (await fetch('https://playentry.org')).text();
    const token: string = (/<meta[^>]*?content=(["\'])?((?:.(?!\1|>))*.?)\1?/.exec(body) ?? [])[2] ??
      '';
  
    return token;
  }

const csrfToken = await getCSRFToken()
console.log(csrfToken)

export const entryApi =
    async (body: unknown) =>
        await fetch(
            "https://playentry.org/graphql",
            {
                method: "post",
                body: JSON.stringify(
                    body
                ),
                headers: {
                    "content-type": "application/json",
                    "csrf-token": csrfToken,
                }
            }
        ).then(x => x.text())