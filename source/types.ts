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
}

export interface CreateComponentOptions {
  name?: string;
  data?: Data;
  onProgress?: (progress: number) => unknown;
  xhr?: XMLHttpRequest;
  onAborted?: () => unknown;
}

export interface Entity {
  id: string;
  __entity_type__: string;
}
interface ResponseMetadata {
  next: {
    offset: number | null;
  };
}
export interface SearchOptions {
  expression: string;
  entityType: string;
  terms?: string[];
  contextId?: string;
  objectTypeIds?: string[];
}

export interface QueryResponse<T = Data> {
  data: T[];
  action: "query";
  metadata: ResponseMetadata;
}

export interface CreateResponse<T = Data> {
  data: T;
  action: "create";
}
export interface UpdateResponse<T = Data> {
  data: T;
  action: "update";
}
export interface DeleteResponse {
  data: true;
  action: "delete";
}
export interface SearchResponse<T = Data> {
  data: T[];
  action: "search";
  metadata: ResponseMetadata;
}
export interface ResetRemoteResponse {
  action: "reset_remote";
  data: Data;
}
export type QuerySchemasResponse = Schema[];
export interface QueryServerInformationResponse {
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
  version?: string;
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
export interface GetUploadMetadataResponse {
  url: string;
  component_id?: string;
  headers: Data;
}

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
}

export interface CallOptions extends MutationOptions, QueryOptions {}
