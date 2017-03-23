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
        this.stack = (new Error()).stack;
    }

    CustomError.prototype = new Error();

    return CustomError;
}

/**
 * Throw when a unknown server error occurs.
 * @class
 * @memberof error
 */
export const ServerError = errorFactory('ServerError');

/**
 * Throw when a permission denied error occurs.
 * @class
 * @memberof error
 */
export const ServerPermissionDeniedError = errorFactory('ServerPermissionDeniedError');

/**
 * Throw when a validation error occurs.
 * @class
 * @memberof error
 */
export const ServerValidationError = errorFactory('ServerValidationError');

/**
 * Throw when event reply timeout occurs.
 * @class
 * @memberof error
 */
export const EventServerReplyTimeoutError = errorFactory('EventServerReplyTimeoutError');

/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */
export const EventServerConnectionTimeoutError = errorFactory('EventServerConnectionTimeoutError');

/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */
export const NotUniqueError = errorFactory('NotUniqueError');



export default {
    ServerError,
    ServerPermissionDeniedError,
    ServerValidationError,
    EventServerReplyTimeoutError,
    EventServerConnectionTimeoutError,
    NotUniqueError,
};
