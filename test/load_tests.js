// :copyright: Copyright (c) 2016 ftrack

require('core-js/fn/object/assign');

// Add support for all files in the test directory
const testsContext = require.context('.', true, /(test_.+\.js$)|(_helper\.js$)/);
testsContext.keys().forEach(testsContext);
