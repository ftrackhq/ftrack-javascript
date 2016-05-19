var webpackCfg = require('./webpack.config');

module.exports = function (config) {
    config.set({
        basePath: '',
        browsers: ['PhantomJS'],
        files: [
            'test/load_tests.js'
        ],
        port: 9876,
        captureTimeout: 60000,
        frameworks: ['mocha', 'chai'],
        logLevel: config.LOG_DEBUG,
        client: {
            captureConsole: true,
            mocha: {
                bail: true,
                ui: 'bdd'
            }
        },
        singleRun: true,
        reporters: ['mocha', 'coverage'],
        preprocessors: {
            'test/load_tests.js': ['webpack', 'sourcemap']
        },
        webpack: webpackCfg,
        webpackServer: {
            noInfo: true
        },
        coverageReporter: {
            dir: 'coverage/',
            reporters: [
                {type: 'html'},
                {type: 'text'}
            ]
        }
    });
};
