const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
  {
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "nostr-zap.js",
      library: "nostrZap",
      libraryTarget: "umd",
    },
    mode: "production",
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ["to-string-loader", "css-loader"],
        },
        {
          test: /\.svg$/,
          type: "asset/inline",
        },
      ],
    },
    resolve: {
      modules: [path.resolve(__dirname, "src"), "node_modules"],
    },
    // This project intentionally ships a single-file embed bundle.
    // The default webpack performance budgets (244 KiB) are a bit too strict for this use-case.
    performance: {
      hints: "warning",
      maxAssetSize: 350 * 1024,
      maxEntrypointSize: 350 * 1024,
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: /@license/i,
            },
            compress: {
              drop_console: true,
            },
          },
          extractComments: false,
        }),
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "src/types/index.d.ts", to: "index.d.ts" }
        ],
      }),
    ],
  },
  {
    // ESModule output
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "nostr-zap.esm.js",
      library: { type: "module" },
      chunkFormat: "module",
    },
    experiments: {
      outputModule: true,
    },
    mode: "production",
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ["to-string-loader", "css-loader"],
        },
        {
          test: /\.svg$/,
          type: "asset/inline",
        },
      ],
    },
    resolve: {
      modules: [path.resolve(__dirname, "src"), "node_modules"],
    },
    // This project intentionally ships a single-file embed bundle.
    // The default webpack performance budgets (244 KiB) are a bit too strict for this use-case.
    performance: {
      hints: "warning",
      maxAssetSize: 350 * 1024,
      maxEntrypointSize: 350 * 1024,
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: /@license/i,
            },
            compress: {
              drop_console: true,
            },
          },
          extractComments: false,
        }),
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "src/types/index.d.ts", to: "index.d.ts" }
        ],
      }),
    ],
  },
];
