..
    :copyright: Copyright (c) 2016 ftrack

.. _installing:

**********
Installing
**********

.. highlight:: bash

Building from source
====================

You can also build manually from the source for more control. First obtain a
copy of the source by either downloading the
`zipball <https://bitbucket.org/ftrack/ftrack-javascript-api/get/master.zip>`_ or
cloning the public repository::

    git clone git@bitbucket.org:ftrack/ftrack-javascript-api.git

Then you can build the package ::

    npm install
    npm run build

Building documentation from source
----------------------------------

To build the documentation from source::

    python setup.py build_sphinx

Then view in your browser::

    file:///path/to/ftrack-javascript-api/build/doc/html/index.html

Dependencies
============

* `Python <http://python.org>`_ >= 2.7, < 3

Additional For building docs
----------------------------

* `Sphinx <http://sphinx-doc.org/>`_ >= 1.2.2, < 2
* `sphinx_rtd_theme <https://github.com/snide/sphinx_rtd_theme>`_ >= 0.1.6, < 1
* `Lowdown <http://lowdown.rtd.ftrack.com/en/stable/>`_ >= 0.1.0, < 2
