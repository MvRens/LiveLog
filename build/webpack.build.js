const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');


module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new UglifyJsPlugin({
      sourceMap: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
});
