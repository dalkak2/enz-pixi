deno run -A npm:esbuild@0.25.4 src/mod.ts \
    --bundle \
    --outfile=dist/src/mod.ts \
    --format=esm \
    --minify \

deno run -A npm:esbuild@0.25.4 api/mod.ts \
    --bundle \
    --outfile=dist/api/mod.ts \
    --format=esm \
    --minify \
