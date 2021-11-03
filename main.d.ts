export type Data = Record<string, any>;

export declare class CustomError extends Error {
  constructor(message: string, errorCode: string);
  errorCode: string;
}

export interface Entity {
  id: string;
  __entity_type__: string;
}

export interface SearchOptions {
  expression: string;
  entityType: string;
  terms?: string[];
  contextId?: string;
  objectTypeIds?: string[];
}

export interface QueryOptions {
  abortController?: AbortController;
}

export interface Response<T> {
  action: string;
  metadata: Data;
  data: T;
}

export interface Operation {}

export interface EventHubOptions {
  applicationId?: string;
}

export interface SessionOptions {
  autoConnectEventHub?: boolean;
  serverInformationValues?: string[];
  eventHubOptions?: EventHubOptions;
  clientToken?: string;
  apiEndpoint?: string;
}

export interface PublishEventOptions {
  onReply?: (event: Event) => void;
  timeout?: number;
}

export class Event<T extends Data = Data> {
  constructor(topic: string, data: T, options: Data);
  getData(): T;
  addSource(source: string): void;
}

export class EventHub {
  constructor(
    serverUrl: string,
    apiUser: string,
    apiKey: string,
    options?: EventHubOptions
  );
  connect(): void;
  isConnected(): boolean;
  publish(
    event: Event,
    options?: {
      onReply?: (event: Event) => void;
      timeout?: number;
    }
  ): Promise<string>;
  publishAndWaitForReply(
    event: Event,
    options?: {
      timeout?: number;
    }
  ): Promise<Event>;
  subscribe(
    subscription: string,
    callback: (event: Event) => Data | void,
    metadata: Data
  ): string;
  getSubscriberByIdentifier(identifier: string): string | null;
  publishReply(event: Event, data: Data, source?: Data): Promise<string>;
}

export class Session {
  constructor(
    serverUrl: string,
    apiUser: string,
    apiKey: string,
    options?: SessionOptions
  );

  apiUser: string;
  apiKey: string;
  serverUrl: string;
  apiEndpoint: string;
  eventHub: EventHub;
  clientToken: string;
  initialized: boolean;
  initializing: Promise<Session>;

  serverInformation?: Data;
  schemas?: Data;
  serverVersion?: string;

  query<T extends Entity>(
    query: string,
    options?: QueryOptions
  ): Promise<Response<T[]>>;
  search<T extends Entity>(
    searchOptions: SearchOptions,
    options?: QueryOptions
  ): Promise<Response<T[]>>;
  create<T extends Entity>(type: string, data: Data): Promise<Response<T>>;
  update<T extends Entity>(
    type: string,
    keys: string[],
    data: Data
  ): Promise<Response<T[]>>;
  delete(type: string, id: string): Promise<Response<void>>;

  call(operations: Operation[]): Promise<Response<any>[]>;
  ensure<T extends Entity>(
    entityType: string,
    data: Data,
    identifyingKeys?: string[]
  ): Promise<Response<T>>;
  createComponent<T>(file: File, options: Data): Promise<Response<T>>;

  getSchema(entityType: string): Data;
  getComponentUrl(componentId: string | null): string | null;
  thumbnailUrl(
    componentId: string | null,
    options?: {
      size?: number;
    }
  ): string;

  getPrimaryKeyAttributes(entityType: string): string[] | null;
  getIdentifyingKey(entity: Entity): string | null;
}

export namespace operation {
  function query(expression: string): Operation;
  function search(searchOptions: SearchOptions): Operation;
  function create(type: string, data: Data): Operation;
  function update(type: string, keys: string[], data: Data): Operation;
  function _delete(type: string, keys: string[]): Operation;

  // noinspection ReservedWordAsName
  export { query, search, create, update, _delete as delete };
}

export namespace error {
  export class ServerError extends CustomError {}
  export class ServerPermissionDeniedError extends CustomError {}
  export class ServerValidationError extends CustomError {}
  export class EventServerReplyTimeoutError extends CustomError {}
  export class EventServerConnectionTimeoutError extends CustomError {}
  export class NotUniqueError extends CustomError {}
  export class CreateComponentError extends CustomError {}
  export class AbortError extends CustomError {}
}
