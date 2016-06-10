..
    :copyright: Copyright (c) 2016 ftrack

.. _installing:

**********
Installing
**********

.. highlight:: bash

Using the pre-built package
===========================

TODO!

Building from source
====================

You can also build manually from the source for more control. First, make sure
you have node (v5+) installed, see :ref:`installing/node` for instructions.

Obtain a copy of the source by either downloading the
`zipball <https://bitbucket.org/ftrack/ftrack-javascript-api/get/master.zip>`_ or
cloning the public repository::

    git clone git@bitbucket.org:ftrack/ftrack-javascript-api.git

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

    file:///path/to/ftrack-javascript-api/build/doc/html/index.html

Dependencies building docs
--------------------------

* `Python <http://python.org>`_ >= 2.7, < 3
* `Sphinx <http://sphinx-doc.org/>`_ >= 1.2.2, < 2
* `sphinx_rtd_theme <https://github.com/snide/sphinx_rtd_theme>`_ >= 0.1.6, < 1
* `Lowdown <http://lowdown.rtd.ftrack.com/en/stable/>`_ >= 0.1.0, < 2

.. _installing/node:

Setting up node environment
===========================

You will need a recent version of node (5+) with npm installed. It is highly
recommended that you also install a version manager for node, such as
`n (Mac OS) <https://github.com/tj/n>`_ or
`nodist (windows) <https://github.com/marcelklehr/nodist>`_. It enables you
can use different node versions in different projects.

Mac OS
------

1. Install `homebrew <http://brew.sh/>`_, unless already installed.
2. Ensure homebrew is installed correctly::

    brew doctor

3. Install latest node and npm versions::

    brew install node

4. Install n globally::

    npm install -g n

5. Install latest stable version::

    n stable

Windows
-------

TODO
