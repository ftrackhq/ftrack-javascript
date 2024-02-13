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
export interface SearchOptions {
  expression: string;
  entityType: EntityType;
  terms?: string[];
  contextId?: string;
  objectTypeIds?: string[];
}

export interface QueryResponse<K extends EntityType = EntityType> {
  data: EntityData<K>[];
  action: "query";
  metadata: ResponseMetadata;
}

export interface CreateResponse<K extends EntityType = EntityType> {
  data: EntityData<K>;
  action: "create";
}
export interface UpdateResponse<K extends EntityType = EntityType> {
  data: EntityData<K>;
  action: "update";
}
export interface DeleteResponse {
  data: true;
  action: "delete";
}
export interface SearchResponse<K extends EntityType = EntityType> {
  data: EntityData<K>[];
  action: "search";
  metadata: ResponseMetadata;
}
export interface ResetRemoteResponse {
  action: "reset_remote";
  data: Data;
}
export type QuerySchemasResponse = Schema[];

export type QueryServerInformationResponse = ServerInformation;
export interface ServerInformation {
  custom_widget?: Data;
  default_colors?: string[];
  is_nested_subqueries_enabled?: boolean;
  license?: string[];
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

export type ActionResponse =
  | QueryResponse
  | CreateResponse
  | UpdateResponse
  | DeleteResponse
  | SearchResponse
  | ResetRemoteResponse
  | QuerySchemasResponse
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
export type SchemaProperties = {
  [key: string]: TypedSchemaProperty | RefSchemaProperty;
};
export type SchemaMixin = {
  $ref: string;
};
export interface Schema {
  properties: SchemaProperties;
  default_projections: string[];
  primary_key: string[];
  required: string[];
  immutable: string[];
  type?: string;
  id: string;
  computed?: string[];
  system_projections?: string[];
  alias_for?: string | Data;
  $mixin?: SchemaMixin;
}
export interface QueryOptions {
  abortController?: AbortController;
  signal?: AbortSignal;
  additionalHeaders?: Data;
  decodeDatesAsIso?: boolean;
  ensureSerializableResponse?: boolean;
}

export interface CallOptions extends MutationOptions, QueryOptions {}

type IsEmptyType<T> = keyof T extends never ? true : false;
type ExcludeNumber<T> = T extends number ? never : T;

export interface ExtendibleEntityTypeMap {}
interface DefaultEntityTypeMap {
  [key: string]: {
    [key: string]: any;
  };
}
export type EntityTypeMap =
  IsEmptyType<ExtendibleEntityTypeMap> extends true
    ? DefaultEntityTypeMap
    : ExtendibleEntityTypeMap;

export type EntityType = ExcludeNumber<keyof EntityTypeMap>;
export type EntityData<TEntityType extends EntityType = EntityType> =
  EntityTypeMap[TEntityType];
