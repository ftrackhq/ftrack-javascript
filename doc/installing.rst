..
    :copyright: Copyright (c) 2016 ftrack

.. _installing:

**********
Installing
**********

.. highlight:: bash

First, make sure you have node (v5+) installed, see :ref:`installing/node` for
instructions.

Usage with Webpack or Browserify
================================

Install the package using NPM::

    npm install --save @ftrack/api

You can then import or require the `@ftrack/api` package::

    var ftrack = require('@ftrack/api');
    var session = new ftrack.Session(...)

Or, using ES2015-style imports::

    import { Session } from '@ftrack/api';
    var session = new Session(...);

Usage with Node
===============

To use the API with node, you will need to install the a polyfill for the fetch
API, `isomorphic-fetch <https://github.com/matthew-andrews/isomorphic-fetch>`_::

    npm install --save isomorphic-fetch @ftrack/api

Require `isomorphic-fetch` to add the polyfill, then require the API and
instantiate a Session.::

    require('isomorphic-fetch');
    var ftrack = require('@ftrack/api');
    var session = new ftrack.Session(...)

.. note::

    Using the event hub from Node is currently not supported.


Building distribution bundle from source
========================================

You can also build manually from the source for more control. First, make sure
you have node (v5+) installed, see :ref:`installing/node` for instructions.

Obtain a copy of the source by cloning the public repository::

    git clone git@github.com:ftrackhq/javascript-api.git

Then you can build the package ::

    npm install
    npm run dist

and run the tests with::

    npm run test

Building documentation from source
==================================

To build the documentation from source::

    python setup.py build_sphinx

Then view in your browser::

    file:///path/to/@ftrack/api/build/doc/html/index.html

Dependencies building docs
--------------------------

* `Python <http://python.org>`_ >= 2.7, < 3
* `Sphinx <http://sphinx-doc.org/>`_ >= 1.2.2, < 2
* `sphinx_rtd_theme <https://github.com/snide/sphinx_rtd_theme>`_ >= 0.1.6, < 1
* `Lowdown <http://lowdown.rtd.ftrack.com/en/stable/>`_ >= 0.1.0, < 2

.. _installing/node:

Setting up node environment
===========================

You will need a recent version of :term:`nodejs` (5+) with npm installed. It is
highly recommended that you also install a version manager for node, such as
`n (Mac OS) <https://github.com/tj/n>`_ or
`nodist (windows) <https://github.com/marcelklehr/nodist>`_. It enables you
to use different node versions in different projects.
