import { defineConfig } from "@apst/tsdown";
import { cjsPreset, dtsPreset, esmPreset } from "@apst/tsdown/presets";

export default defineConfig(
    {
        entry: {
            index: "./src/index.ts",
            polyfill: "./src/polyfill.ts",
        },
        platform: "browser",
        unbundle: true,
    },
    [
        esmPreset(),
        cjsPreset(),
        dtsPreset(),
    ],
);
