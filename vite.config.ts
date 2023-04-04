import { defineConfig, UserConfig } from "vite";
import { InlineConfig } from "vitest";
import path from "path";
import dts from "vite-plugin-dts";
import commonjs from "@rollup/plugin-commonjs";

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
      }
    },
  },
  plugins: [dts()],
  test: {
    environment: "jsdom",
    globals: true,
    globalSetup: "./vitest.globalsetup.js",
    setupFiles: ["./vitest.setup.js"],
    deps: {
      fallbackCJS: true,
    },
  },
} as VitestConfigExport);
