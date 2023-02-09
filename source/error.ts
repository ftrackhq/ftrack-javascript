// :copyright: Copyright (c) 2016 ftrack

/**
 *
 * Return a new error class from *name*.
 *
 * @private
 * @param  {string} name name of error class
 * @return {CustomError}      Custom error object
 */
function errorFactory(name: string) {
  class CustomError extends Error {
    errorCode?: string;

    constructor(message: string, errorCode?: string) {
      super(message);
      this.name = name;
      this.errorCode = errorCode;
    }
  }

  return CustomError;
}

/**
 * Throw when a unknown server error occurs.
 * @class
 * @memberof error
 */
export const ServerError = errorFactory("ServerError");

/**
 * Throw when a permission denied error occurs.
 * @class
 * @memberof error
 */
export const ServerPermissionDeniedError = errorFactory(
  "ServerPermissionDeniedError"
);

/**
 * Throw when a validation error occurs.
 * @class
 * @memberof error
 */
export const ServerValidationError = errorFactory("ServerValidationError");

/**
 * Throw when event reply timeout occurs.
 * @class
 * @memberof error
 */
export const EventServerReplyTimeoutError = errorFactory(
  "EventServerReplyTimeoutError"
);

/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */
export const EventServerConnectionTimeoutError = errorFactory(
  "EventServerConnectionTimeoutError"
);

/**
 * Throw when event hub hasn't been connected to the event server.
 * @class
 * @memberof error
 */
export const EventServerPublishError = errorFactory("EventServerPublishError");

/**
 * Throw when event server connection timeout occurs.
 * @class
 * @memberof error
 */
export const NotUniqueError = errorFactory("NotUniqueError");

/**
 * Throw when file upload to event server is aborted or does not succeed.
 * @class
 * @memberof error
 */
export const CreateComponentError = errorFactory("CreateComponentError");

export const AbortError = errorFactory("AbortError");
