const webpackCfg = require('./webpack.config');

module.exports = config => {
    config.set({
        basePath: '',
        browsers: ['ChromiumNoSandbox'],
        port: 9876,
        captureTimeout: 60000,
        singleRun: true,
        webpack: webpackCfg,
        webpackServer: {
            noInfo: true,
        },
        customLaunchers: {
            ChromiumNoSandbox: {
                base: 'ChromiumHeadless',
                flags: [
                    '--no-sandbox',
                    '--headless',
                    '--disable-gpu',
                    '--disable-translate',
                    '--disable-extensions',
                ],
            },
        },
        client: {
            args: process.argv,
            mocha: {
                timeout: 10000,
            },
        },
        files: ['test/load_tests.js'],
        preprocessors: {
            'test/load_tests.js': ['webpack', 'sourcemap'],
        },

        frameworks: ['mocha', 'chai-as-promised', 'chai'],
        plugins: [
            'karma-chai',
            'karma-chai-as-promised',
            'karma-coverage',
            'karma-mocha',
            'karma-mocha-reporter',
            'karma-chrome-launcher',
            'karma-sourcemap-loader',
            'karma-webpack',
        ],
        reporters: ['mocha', 'coverage'],
        mochaReporter: {
            showDiff: true,
        },
        coverageReporter: {
            dir: 'coverage/',
            reporters: [{ type: 'html' }, { type: 'text' }],
        },
    });
};
