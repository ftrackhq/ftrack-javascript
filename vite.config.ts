import { defineConfig, type UserConfig } from "vite";
import type { InlineConfig } from "vitest";
import path from "path";
import dts from "vite-plugin-dts";

interface VitestConfigExport extends UserConfig {
  test: InlineConfig;
}

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "source/index.ts"),
      name: "ftrack-javascript-api",
      fileName: (format) =>
        `ftrack-javascript-api.${format}.${format === "umd" ? "cjs" : "js"}`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["moment", "uuid", "loglevel", "isomorphic-ws"],
      output: {
        globals: {
          "ftrack-javascript-api": "ftrack",
          moment: "moment",
          uuid: "uuid",
          loglevel: "log",
          "isomorphic-ws": "WebSocket",
        },
      },
    },
  },
  plugins: [
    dts({ rollupTypes: false, entryRoot: "source", include: "source" }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    globalSetup: "./vitest.globalsetup.js",
    setupFiles: ["./vitest.setup.js"],
  },
} as VitestConfigExport);
