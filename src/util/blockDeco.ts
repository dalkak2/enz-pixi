export const yet =
(_: unknown, ctx: ClassMethodDecoratorContext) => {
    return (...args: unknown[]) => {
        console.error(`enz: ${ctx.name.toString()}(${
            args.slice(0, -1)
                .map(x => typeof x == "string"
                    ? `"${x}"`
                    : x
                )
                .join(", ")
        }) is not yet implemented`)
    }
}
