const webpack = require('webpack');
const path = require('path');

const config = {
    devtool: 'inline-source-map',
    module: {
        preLoaders: [
            {
                test: /\.(js|jsx)$/,
                loader: 'isparta-instrumenter-loader',
                include: [
                    path.resolve('./source'),
                ],
                exclude: [
                    path.resolve('./source/socket.io-websocket-only.js'),
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
        new webpack.DefinePlugin({
            'process.env': {
                FTRACK_SERVER: JSON.stringify(process.env.FTRACK_SERVER),
                FTRACK_API_USER: JSON.stringify(process.env.FTRACK_API_USER),
                FTRACK_API_KEY: JSON.stringify(process.env.FTRACK_API_KEY),
            },
        }),
        new webpack.ProvidePlugin({
            Promise: 'imports?this=>global!exports?global.Promise!es6-promise',
            fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
        }),
    ],
};

module.exports = config;
