module.exports = {
  entry: [ "./src/game.ts" ],
  output: {
    path: __dirname + "/site",
    filename: "electron.js",
    library: "electron"
  },
  externals: [
  ],
  node: {
    Buffer: false
  },
  resolve: {
    extensions: [ ".ts", ".js" ]
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: "ts-loader" }
    ]
  }
};
