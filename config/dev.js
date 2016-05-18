const webpack = require('webpack');
const path = require('path');

const config = {
    entry: path.resolve('./src/index.js'),
    devtool: 'source-map',
    output: {
        path: path.resolve('./lib'),
        filename: 'ftrack_api.js',
        library: 'ftrack_api',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    module: {
        preLoaders: [
            {
                test: /\.(js|jsx)$/,
                loader: 'isparta-instrumenter-loader',
                include: [
                    path.resolve('./src'),
                ],
            },
        ],
        loaders: [
            {
                test: /\.(png|jpg|gif|woff|woff2|css|sass|scss|less|styl)$/,
                loader: 'null-loader',
            },
            {
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015'],
                },
                include: [
                    path.resolve('./src'),
                    path.resolve('./test'),
                ],
            },
        ],
    },
    resolve: {
        root: path.resolve('./src'),
        extensions: ['', '.js'],
    },
    plugins: [
        new webpack.ProvidePlugin({
            Promise: 'imports?this=>global!exports?global.Promise!es6-promise',
            fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
        }),
    ],
};

module.exports = config;
