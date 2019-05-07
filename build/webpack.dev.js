'use strict'

const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");

module.exports = merge(common, {
  mode: "development",
  devServer: {
    proxy: {
      '/api/live': {
         target: 'ws://localhost:3000',
         ws: true
      },
      '/api/files': {
        target: 'http://localhost:3000'
      }
    }
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin()
  ]
});
