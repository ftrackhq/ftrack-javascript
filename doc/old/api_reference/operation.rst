.. _global.rst#opera:

========================
Namespace: ``operation``
========================


.. contents:: Local Navigation
   :local:

Description
===========

Operations module


Function ``create``
===================

Return create operation object for entity *type* and *data*.

.. js:function:: create(type, data)

    
    :param string type: Entity type
    :param Object data: Entity data to use for creation
    :return Object: API operation
    


Function ``query``
==================

Return query operation object for *expression*.

.. js:function:: query(expression)

    
    :param string expression: API query expression
    :return Object: API operation
    


Function ``update``
===================

Return update operation object for entity *type* identified by *keys*.

.. js:function:: update(type, keys, data)

    
    :param string type: Entity type
    :param Array keys: Identifying keys, typically [<entity id>]
    :param Object data: values to update
    :return Object: API operation
    


Function ``delete``
===================

Return delete operation object for entity *type* identified by *keys*.

.. js:function:: delete(type, keys)

    
    :param string type: Entity type
    :param Array keys: Identifying keys, typically [<entity id>]
    :return Object: API operation
    

