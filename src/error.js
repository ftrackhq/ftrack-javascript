// :copyright: Copyright (c) 2016 ftrack

/** Return a new error class from *name*. */
function _errorFactory(name) {
    function CustomError(message) {
        this.name = name;
        this.message = message;
        this.stack = (new Error()).stack;
    }

    CustomError.prototype = new Error();

    return CustomError;
}

// Throw when a unknown server error occurs.
export const ServerError = _errorFactory('ServerError');

// Throw when a permission denied error occurs.
export const ServerPermissionDeniedError = _errorFactory('ServerPermissionDeniedError');

// Throw when a validation error occurs.
export const ServerValidationError = _errorFactory('ServerValidationError');

// Throw when event reply timeout occurs.
export const EventServerReplyTimeoutError = _errorFactory('EventServerReplyTimeoutError');

// Throw when event server connection timeout occurs.
export const EventServerConnectionTimeout = _errorFactory('EventServerConnectionTimeout');
