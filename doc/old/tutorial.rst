..
    :copyright: Copyright (c) 2016 ftrack

.. _tutorial:

********
Tutorial
********

This tutorial provides a quick dive into using the API and the broad stroke
concepts involved.

.. note::

    This tutorial uses the distribution bundle in a web page, but you can also
    use the node REPL. See :ref:`installing` for instructions.

Start of by creating a directory for the tutorial, download and place the
pre-built JavaScript API file there. Create a new HTML file and include the
following contents.

.. literalinclude:: /resource/empty_example.html
    :language: html

Save the HTML file and open it in your web browser of choice. Then open the
browser's JavaScript console to start playing around with the API.

The API uses sessions to manage communication with an ftrack server. Create a
session that connects to your ftrack server (changing the passed values as
appropriate)::

    var session = new ftrack.Session(
        'https://my-company.ftrackapp.com',
        'john.doe@example.com',
        '7545344e-a653-11e1-a82c-f22c11dd25eq'
    );

    session.initializing.then(function () {
        console.info('API session initialized successfully.');
    });

If everything works as expected, you should see the console message appear in
the JavaScript console. If not, double check that the credentials you specified
are correct.

The communication with the ftrack server in the JavaScript API is asynchronous,
often returning :term:`Promises <promise>`. When the session is constructed,
the instance is returned immediately, while the API is being initialized in the
background. Once the API has been initialized, the `session.initializing`
:term:`promise` will be resolved.

.. note::

    If session methods are used before the session is fully initialized, the
    execution will be delayed until the session is initialized.

Query projects
==============

Now, let's start of using the API with an example. Let's list the names of all
projects.

.. literalinclude:: /resource/example_query_projects.js
    :language: javascript

Each project returned will be a plain JavaScript object and contain the selected
attributes.

The session contains a few other methods besides :js:func:`query`, such as
:js:func:`create`, :js:func:`update` and :js:func:`delete`. Next up, let's take
a look at combining the query call with an update operation. Since the method
return :term:`promises <promise>`, we can chain various asynchronous operations
one after the other.

In the example below a specific project is retrieved, and then its status is
set to hidden, hiding the project from the UI.

.. literalinclude:: /resource/example_update_project.js
    :language: javascript

.. seealso::

    Now that you have gotten the hang of the basics, have a look at a more
    realistic example, using the API to display versions published in a
    dashboard widget within the ftrack web interface.

    https://bitbucket.org/ftrack/ftrack-javascript-api-example-basic-widget

.. _tutorial/create_component:

Uploading files
===============

Files are stored as components in ftrack. Here is an example on how to create a
component from a file in ftrack and upload it to the ftrack.server location.

.. literalinclude:: /resource/create_component.js
    :language: javascript
