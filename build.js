import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const DIST_DIR = 'dist';

// Clean and create dist directory
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR);

// Bundle JavaScript with esbuild
console.log('Bundling JavaScript...');
await esbuild.build({
    entryPoints: ['sourceFiles/main.js'],
    bundle: true,
    minify: true,
    sourcemap: false,
    format: 'esm',
    outfile: `${DIST_DIR}/bundle.js`,
    target: ['es2020'],
    // Mangle property names for extra obfuscation (be careful with this)
    mangleProps: /^_/,
});

// Copy CSS
console.log('Copying CSS...');
fs.mkdirSync(`${DIST_DIR}/css`, { recursive: true });
fs.copyFileSync('sourceFiles/css/style.css', `${DIST_DIR}/css/style.css`);

// Copy audio folder
console.log('Copying audio...');
function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
copyDir('audio', `${DIST_DIR}/audio`);

// Create production index.html
console.log('Creating index.html...');
const indexHtml = `<!DOCTYPE html>
<html lang="en" oncontextmenu="return false">
<head>
    <meta name="viewport" content="width=device-width, height=device-height">
    <title>MOBA Dodge Game - Simple</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body oncontextmenu="return false">
    <canvas id="canvas1"></canvas>
    <script type="module" src="bundle.js"></script>
</body>
</html>`;
fs.writeFileSync(`${DIST_DIR}/index.html`, indexHtml);

console.log('Build complete! Output in dist/');
