#!/usr/bin/env node
/**
 * IDLE CITY — build script
 * Author: Dr. Sohil Momin
 *
 * Inlines src/style.css and src/game.js into a single playable file
 * (index.html) and produces a minified build (idle-city.min.html).
 *
 * Usage:  node build/build.js
 * Requires (dev-only, not shipped): terser, html-minifier-terser
 */
const fs = require("fs");
const path = require("path");
const { minify } = require("html-minifier-terser");

const root = path.join(__dirname, "..");
const src = path.join(root, "src");

const html = fs.readFileSync(path.join(src, "index.html"), "utf8");
const css = fs.readFileSync(path.join(src, "style.css"), "utf8");
const js = fs.readFileSync(path.join(src, "game.js"), "utf8");

const single = html
  .replace(/<link rel="stylesheet" href="style\.css"\s*\/?>/,
    "<style>\n" + css.trim() + "\n</style>")
  .replace(/<script src="game\.js"><\/script>/,
    "<script>\n" + js.trim() + "\n</script>");

fs.writeFileSync(path.join(root, "index.html"), single);

const MIN_OPTS = {
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  removeAttributeQuotes: true,
  minifyCSS: true,
  minifyJS: { compress: { passes: 2 }, mangle: { toplevel: true } }
};

minify(single, MIN_OPTS).then((min) => {
  fs.writeFileSync(path.join(root, "idle-city.min.html"), min);
  const kb = (n) => (n / 1024).toFixed(1) + " KB";
  console.log("index.html        " + kb(Buffer.byteLength(single)));
  console.log("idle-city.min.html " + kb(Buffer.byteLength(min)));
  console.log("saved " + (100 * (1 - Buffer.byteLength(min) / Buffer.byteLength(single))).toFixed(1) + "%");
});
