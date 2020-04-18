const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    main_bundle: "./frontend/src/index.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      { 
        test: /\.js$/, 
        enforce: "pre", // preload the jshint loader
        exclude: /node_modules/, 
        loader: "babel-loader" 
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/i,
        use: [
          'file-loader',
        ],
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './frontend/src/index.html', to: 'index.html' },
      // { from: './src/data.csv', to: 'data.csv' },
    ]),
  ],
  // watch: true,
  watchOptions: {
    ignored: './node_modules/'
  },
  devtool: "#source-map" 
};