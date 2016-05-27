const webpack = require('webpack');
const path = require('path');

const config = {
    entry: ['babel-polyfill', path.resolve('./source/index.js')],
    devtool: 'source-map',
    output: {
        path: path.resolve('./lib'),
        filename: 'ftrack.js',
        library: 'ftrack',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    module: {
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
                    path.resolve('./source'),
                    path.resolve('./test'),
                ],
            },
        ],
    },
    resolve: {
        root: path.resolve('./source'),
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
