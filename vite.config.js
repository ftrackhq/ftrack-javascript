const path = require("path");
const { defineConfig } = require("vite");
const commonjs = require("@rollup/plugin-commonjs");

module.exports = defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "source/index.js"),
      name: "ftrack-javascript-api",
      fileName: (format) => `ftrack-javascript-api.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["moment", "uuid", "loglevel"],
      output: {
        globals: {
          "ftrack-javascript-api": "ftrack",
          moment: "moment",
          uuid: "uuid",
          loglevel: "log",
        },
      },
      plugins: [commonjs({ include: "./source/socket.io-websocket-only.cjs" })],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    deps: {
      fallbackCJS: true,
    },
  },
});
