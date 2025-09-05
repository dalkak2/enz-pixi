deno run -A npm:esbuild@0.25.9 src/mod.ts \
    --bundle \
    --outfile=dist/src/mod.ts \
    --format=esm \
    --minify \
    --target=es2024 \

deno run -A npm:esbuild@0.25.9 api/mod.ts \
    --bundle \
    --outfile=dist/api/mod.ts \
    --format=esm \
    --minify \
