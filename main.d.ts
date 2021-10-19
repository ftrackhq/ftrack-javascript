type Data = Record<string, any>;

declare class CustomError extends Error {
    constructor(message: string, errorCode: string);
    errorCode: string;
}

declare namespace M {
    interface Entity {
        id: string;
        __entity_type__: string;
    }

    interface SearchOptions {
        expression: string;
        entityType: string;
        terms?: string[];
        contextId?: string;
        objectTypeIds?: string[];
    }

    interface QueryOptions {
        abortController?: AbortController;
    }

    interface Response<T> {
        action: string;
        metadata: Data;
        data: T;
    }

    interface Operation {}

    interface EventHubOptions {
        applicationId?: string;
    }

    interface SessionOptions {
        autoConnectEventHub?: boolean,
        serverInformationValues?: string[],
        eventHubOptions?: EventHubOptions,
        clientToken?: string,
        apiEndpoint?: string,
    }

    interface PublishEventOptions {
        onReply?: (event: Event) => void;
        timeout?: number;
    }

    class Event<T extends Data = Data> {
        constructor(topic: string, data: T, options: Data);
        getData(): T;
        addSource(source: string): void;
    }

    class EventHub {
        constructor(serverUrl: string, apiUser: string, apiKey: string, options?: EventHubOptions);
        connect(): void;
        isConnected(): boolean;
        publish(event: Event, options?: {
            onReply?: (event: Event) => void;
            timeout?: number;
        }): Promise<string>;
        publishAndWaitForReply(event: Event, options?: {
            timeout?: number;
        }): Promise<Event>;
        subscribe(subscription: string, callback: (event: Event) => Data | void, metadata: Data): string;
        getSubscriberByIdentifier(identifier: string): string | null;
        publishReply(event: Event, data: Data, source?: Data): Promise<string>;
    }

    class Session {
        constructor(serverUrl: string, apiUser: string, apiKey: string, options?: SessionOptions);

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

        query<T extends Entity>(query: string, options?: QueryOptions): Promise<Response<T[]>>;
        search<T extends Entity>(searchOptions: SearchOptions, options?: QueryOptions): Promise<Response<T[]>>;
        create<T extends Entity>(type: string, data: Data): Promise<Response<T>>;
        update<T extends Entity>(type: string, keys: string[], data: Data): Promise<Response<T[]>>;
        delete(type: string, id: string): Promise<Response<void>>;

        call(operations: Operation[]): Promise<Response<any>[]>;
        ensure<T extends Entity>(entityType: string, data: Data, identifyingKeys?: string[]): Promise<Response<T>>;
        createComponent<T>(file: File, options: Data): Promise<Response<T>>;

        getSchema(entityType: string): Data;
        getComponentUrl(componentId: string | null): string | null;
        thumbnailUrl(componentId: string | null, options?: {
            size?: number,
        }): string;

        getPrimaryKeyAttributes(entityType: string): string[] | null;
        getIdentifyingKey(entity: Entity): string | null;
    }

    namespace operation {
        function query(expression: string): Operation;
        function search(searchOptions: SearchOptions): Operation;
        function create(type: string, data: Data): Operation;
        function update(type: string, keys: string[], data: Data): Operation;
        function _delete(type: string, keys: string[]): Operation;

        // noinspection ReservedWordAsName
        export {
            query,
            search,
            create,
            update,
            _delete as delete,
        };
    }

    namespace error {
        class ServerError extends CustomError{}
        class ServerPermissionDeniedError extends CustomError{}
        class ServerValidationError extends CustomError{}
        class EventServerReplyTimeoutError extends CustomError{}
        class EventServerConnectionTimeoutError extends CustomError{}
        class NotUniqueError extends CustomError{}
        class CreateComponentError extends CustomError{}
        class AbortError extends CustomError{}
    }
}


export = M;