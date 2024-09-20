// @ts-check
import * as fs from "node:fs";
import * as path from "node:path";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import { dts } from "rollup-plugin-dts";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRootDir = path.resolve(__dirname);

/** @type {import('./package.json')} */
const pkg = JSON.parse(
    fs.readFileSync("./package.json", { encoding: "utf-8" }),
);

/** @type { import('rollup').RollupOptions } */
const commonConfig = {
    input: "./src/index.ts",
    onwarn: (warning) => {
        throw new Error(warning?.message);
    },
};

/** @type { import('rollup').RollupOptions } */
const dtsConfig = {
    plugins: [
        dts({
            respectExternal: true,
            tsconfig: path.resolve(projectRootDir, "./tsconfig.json"),
        }),
    ],
    output: [
        {
            file: pkg.main.replace(/\.cjs$/, ".d.cts"),
        },
        {
            file: pkg.module.replace(/\.js$/, ".d.ts"),
        },
    ],
}

/** @type { import('rollup').RollupOptions } */
const sourceConfig = {
    plugins: [
        nodeResolve({ extensions: [".ts"] }),
        babel({
            exclude: "node_modules/**",
            extensions: [".ts"],
            babelHelpers: "bundled",
            configFile: path.resolve(projectRootDir, "./babel.config.json"),
        }),
    ],
    output: [
        {
            file: pkg.main,
            format: "cjs",
        },
        {
            file: pkg.module,
            format: "es",
        },
    ],
}

/** @type { Array<import('rollup').RollupOptions> } */
export default [
    {
        ...commonConfig,
        ...sourceConfig,
    },
    {
        ...commonConfig,
        ...dtsConfig,
    },
];
