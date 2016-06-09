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
            'test/load_tests.js',
        ],
        preprocessors: {
            'test/load_tests.js': ['webpack', 'sourcemap'],
        },

        frameworks: ['mocha', 'chai'],
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
