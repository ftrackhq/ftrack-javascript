export type Data = { [key: string]: any };
export type IsTuple<T> = T extends [any, ...any] ? true : false;
export interface EventHubOptions {
  applicationId?: string;
}

export interface SessionOptions {
  autoConnectEventHub?: boolean;
  serverInformationValues?: string[];
  eventHubOptions?: EventHubOptions;
  clientToken?: string;
  apiEndpoint?: string;
  additionalHeaders?: Data;
  strictApi?: boolean;
  decodeDatesAsIso?: boolean;
  ensureSerializableResponse?: boolean;
}

export interface CreateComponentOptions {
  name?: string;
  data?: Data;
  onProgress?: (progress: number) => unknown;
  xhr?: XMLHttpRequest;
  signal?: AbortSignal;
  onAborted?: () => unknown;
}

interface ResponseMetadata {
  next: {
    offset: number | null;
  };
}
export interface SearchOptions<TEntityType = keyof DefaultEntityTypeMap> {
  expression: string;
  entityType: TEntityType;
  terms?: string[];
  contextId?: string;
  objectTypeIds?: string[];
}

export interface QueryResponse<
  TEntityData = DefaultEntityTypeMap[keyof DefaultEntityTypeMap],
> {
  data: TEntityData[];
  action: "query";
  metadata: ResponseMetadata;
}

export interface CreateResponse<
  TEntityData = DefaultEntityTypeMap[keyof DefaultEntityTypeMap],
> {
  data: TEntityData;
  action: "create";
}
export interface UpdateResponse<
  TEntityData = DefaultEntityTypeMap[keyof DefaultEntityTypeMap],
> {
  data: TEntityData;
  action: "update";
}
export interface DeleteResponse {
  data: true;
  action: "delete";
}
export interface SearchResponse<
  TEntityData = DefaultEntityTypeMap[keyof DefaultEntityTypeMap],
> {
  data: TEntityData[];
  action: "search";
  metadata: ResponseMetadata;
}
export interface ResetRemoteResponse {
  action: "reset_remote";
  data: Data;
}
export type QuerySchemasResponse<TEntityTypeMap = DefaultEntityTypeMap> =
  Schema<TEntityTypeMap>[];

export type QueryServerInformationResponse = ServerInformation;
export interface ServerInformation {
  custom_widget?: Data;
  default_colors?: string[];
  is_nested_subqueries_enabled?: boolean;
  license?: {
    feature_id: string;
    quantity: number;
    renewal_date: string;
    date: string;
  }[];
  preferred_language?: string;
  week_startday?: number;
  workday_length?: number;
  display_week_numbers?: boolean;
  storage_limit?: number;
  display_task_dates_as_time?: boolean;
  company_information?: {
    logo_url?: string;
    name?: string;
  };
  user_information?: {
    access_key_id?: string | null;
    id?: string;
    is_global_access_key?: boolean;
    restricted_user?: boolean;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  product?: Data;
  version: string;
  schema_hash?: string;
  storage_scenario?: Data;
  [key: string]: any;
}

export interface GetWidgetUrlResponse {
  widget_url: string;
}
export interface DelayedJobResponse {
  action: "delayed_job";
  data?: any;
}
export interface EncodeMediaResponse {
  job_id: string;
}

export interface SinglePartGetUploadMetadataResponse {
  url: string;
  component_id: string;
  headers: Data;
}

export interface MultiPartUploadPart {
  signed_url: string;
  part_number: number;
}
export interface MultiPartGetUploadMetadataResponse {
  component_id: string;
  urls: MultiPartUploadPart[];
  upload_id: string;
}

export type GetUploadMetadataResponse =
  | SinglePartGetUploadMetadataResponse
  | MultiPartGetUploadMetadataResponse;

export interface SendReviewSessionInviteResponse {
  sent: true;
}
export interface SendUserInviteResponse {
  sent: true;
}
export interface ComputeRollupsResponse {
  data: any[];
}
export interface GenerateSignedUrlResponse {
  signed_url: string;
}
export interface PermissionsResponse {
  action: "permissions";
  data: Data;
}

export type ActionResponse<
  TEntityTypeMap = DefaultEntityTypeMap,
  TEntityType extends keyof TEntityTypeMap = keyof TEntityTypeMap,
  TEntityData = TEntityTypeMap[TEntityType],
> =
  | QueryResponse<TEntityData>
  | CreateResponse<TEntityData>
  | UpdateResponse<TEntityData>
  | DeleteResponse
  | SearchResponse<TEntityData>
  | ResetRemoteResponse
  | QuerySchemasResponse<TEntityTypeMap>
  | QueryServerInformationResponse
  | GetWidgetUrlResponse
  | DelayedJobResponse
  | EncodeMediaResponse
  | GetUploadMetadataResponse
  | SendReviewSessionInviteResponse
  | SendUserInviteResponse
  | ComputeRollupsResponse
  | GenerateSignedUrlResponse
  | PermissionsResponse;

export interface ResponseError {
  exception: string;
  content: string;
  error_code?: string;
  error?: Data;
}

export interface MutationOptions {
  pushToken?: string;
  additionalHeaders?: Data;
  decodeDatesAsIso?: boolean;
  ensureSerializableResponse?: boolean;
}

export type SimpleTypeSchemaProperty = {
  type: "string" | "boolean" | "number" | "integer" | "variable";
  format?: string;
  description?: string;
  alias_for?: string;
  default?: string;
};
export type ArrayTypeSchemaProperty = {
  type: "array" | "mapped_array";
  items: RefSchemaProperty;
  description?: string;
  alias_for?: string;
};
export type TypedSchemaProperty =
  | SimpleTypeSchemaProperty
  | ArrayTypeSchemaProperty;
export type RefSchemaProperty = {
  ["$ref"]: string;
};
export type SchemaProperties<
  TEntityData = DefaultEntityTypeMap[keyof DefaultEntityTypeMap],
> = {
  [key in keyof TEntityData]: TypedSchemaProperty | RefSchemaProperty;
};
export type SchemaMixin = {
  $ref: string;
};
export type SchemaMetadata = { entity_event: boolean };

export type SchemaDeprecated = { $ref: string; message: string };
export interface Schema<
  TEntityTypeMap = DefaultEntityTypeMap,
  TEntityType extends keyof TEntityTypeMap = keyof TEntityTypeMap,
> {
  properties: SchemaProperties<TEntityTypeMap[TEntityType]>;
  default_projections: string[];
  primary_key: string[];
  required: string[];
  immutable: string[];
  type?: string;
  id: TEntityType;
  computed?: string[];
  system_projections?: string[];
  alias_for?: string | Data;
  $mixin?: SchemaMixin;
  metadata?: SchemaMetadata;
  deprecated?: SchemaDeprecated;
}
export interface QueryOptions {
  abortController?: AbortController;
  signal?: AbortSignal;
  additionalHeaders?: Data;
  decodeDatesAsIso?: boolean;
  ensureSerializableResponse?: boolean;
}

export interface CallOptions extends MutationOptions, QueryOptions {}

export interface ExtendibleEntityTypeMap {}
export interface DefaultEntityTypeMap {
  [key: string]: {
    [key: string]: any;
  };
}
