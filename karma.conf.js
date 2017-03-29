var webpackCfg = require('./webpack.config');

module.exports = function(config) {
    config.set({
        basePath: '',
        browsers: ['PhantomJS'],
        port: 9876,
        captureTimeout: 60000,

        singleRun: true,
        webpack: webpackCfg,
        webpackServer: {
            noInfo: true,
        },

        files: [
            './node_modules/phantomjs-polyfill-find/find-polyfill.js',
            'test/load_tests.js',
        ],
        preprocessors: {
            'test/load_tests.js': ['webpack', 'sourcemap'],
        },

        frameworks: ['mocha', 'chai-as-promised', 'chai'],
        plugins:  [
            'karma-chai',
            'karma-chai-as-promised',
            'karma-coverage',
            'karma-mocha',
            'karma-mocha-reporter',
            'karma-phantomjs-launcher',
            'karma-sourcemap-loader',
            'karma-webpack',
        ],
        reporters: ['mocha', 'coverage'],
        mochaReporter: {
            showDiff: true,
        },
        coverageReporter: {
            dir: 'coverage/',
            reporters: [
                { type: 'html' },
                { type: 'text' },
            ],
        },
    });
};
