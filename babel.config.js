module.exports = function config(api) {
  return {
    presets: ["@babel/preset-env"],

    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-object-rest-spread",
    ],

    overrides: [
      {
        test: /\.tsx?$/,
        presets: ["@babel/preset-typescript"],
      },
      {
        test: /\.tsx$/,
        presets: [
          [
            "@babel/preset-react",
            {
              development: api.env() === "development",
              useBuiltIns: true,
              runtime: "automatic",
              importSource: "@emotion/react",
            },
          ],
        ],
        plugins: ["@emotion/babel-plugin"],
      },
      {
        test: "**/*.d.ts",
        presets: [["@babel/preset-env", { targets: { esmodules: true } }]],
      },
    ],
  };
};
