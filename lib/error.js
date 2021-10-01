"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.AbortError = exports.CreateComponentError = exports.NotUniqueError = exports.EventServerConnectionTimeoutError = exports.EventServerReplyTimeoutError = exports.ServerValidationError = exports.ServerPermissionDeniedError = exports.ServerError = void 0;

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


var ServerError = errorFactory("ServerError");
/**
 * Throw when a permission denied error occurs.
 * @class
 * @memberof error
 */

exports.ServerError = ServerError;
var ServerPermissionDeniedError = errorFactory("ServerPermissionDeniedError");
/**
 * Throw when a validation error occurs.
 * @class
 * @memberof error
 */

exports.ServerPermissionDeniedError = ServerPermissionDeniedError;
var ServerValidationError = errorFactory("ServerValidationError");
/**
 * Throw when event reply timeout occurs.
 * @class
 * @memberof error
 */

exports.ServerValidationError = ServerValidationError;
var EventServerReplyTimeoutError = errorFactory("EventServerReplyTimeoutError");
/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */

exports.EventServerReplyTimeoutError = EventServerReplyTimeoutError;
var EventServerConnectionTimeoutError = errorFactory("EventServerConnectionTimeoutError");
/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */

exports.EventServerConnectionTimeoutError = EventServerConnectionTimeoutError;
var NotUniqueError = errorFactory("NotUniqueError");
/**
 * Throw when file upload to event server is aborted or does not succeed.
 * @class
 * @memberof error
 */

exports.NotUniqueError = NotUniqueError;
var CreateComponentError = errorFactory("CreateComponentError");
exports.CreateComponentError = CreateComponentError;
var AbortError = errorFactory("AbortError");
exports.AbortError = AbortError;
var _exports = {
  ServerError: ServerError,
  ServerPermissionDeniedError: ServerPermissionDeniedError,
  ServerValidationError: ServerValidationError,
  EventServerReplyTimeoutError: EventServerReplyTimeoutError,
  EventServerConnectionTimeoutError: EventServerConnectionTimeoutError,
  NotUniqueError: NotUniqueError,
  CreateComponentError: CreateComponentError,
  AbortError: AbortError
};
var _default = _exports;
exports["default"] = _default;