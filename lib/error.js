'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// :copyright: Copyright (c) 2016 ftrack
/**
 * Error namespace
 * @namespace error
 */

/**
 * 
 * Return a new error class from *name*.
 * 
 * @private
 * @param  {string} name name of error class
 * @return {CustomError}      Custom error object
 */
function errorFactory(name) {
  function CustomError(message, errorCode) {
    this.name = name;
    this.message = message;
    this.errorCode = errorCode;
    this.stack = new Error().stack;
  }

  CustomError.prototype = new Error();

  return CustomError;
}

/**
 * Throw when a unknown server error occurs.
 * @class
 * @memberof error
 */
var ServerError = exports.ServerError = errorFactory('ServerError');

/**
 * Throw when a permission denied error occurs.
 * @class
 * @memberof error
 */
var ServerPermissionDeniedError = exports.ServerPermissionDeniedError = errorFactory('ServerPermissionDeniedError');

/**
 * Throw when a validation error occurs.
 * @class
 * @memberof error
 */
var ServerValidationError = exports.ServerValidationError = errorFactory('ServerValidationError');

/**
 * Throw when event reply timeout occurs.
 * @class
 * @memberof error
 */
var EventServerReplyTimeoutError = exports.EventServerReplyTimeoutError = errorFactory('EventServerReplyTimeoutError');

/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */
var EventServerConnectionTimeoutError = exports.EventServerConnectionTimeoutError = errorFactory('EventServerConnectionTimeoutError');

/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */
var NotUniqueError = exports.NotUniqueError = errorFactory('NotUniqueError');

exports.default = {
  ServerError: ServerError,
  ServerPermissionDeniedError: ServerPermissionDeniedError,
  ServerValidationError: ServerValidationError,
  EventServerReplyTimeoutError: EventServerReplyTimeoutError,
  EventServerConnectionTimeoutError: EventServerConnectionTimeoutError,
  NotUniqueError: NotUniqueError
};