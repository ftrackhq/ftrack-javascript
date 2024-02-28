// :copyright: Copyright (c) 2023 ftrack

import loglevel from "loglevel";
import { Event, operation } from "./index.js";
import { SERVER_LOCATION_ID } from "./constant.js";
import { CreateComponentError } from "./error.js";
import { Session } from "./session.js";
import { v4 as uuidV4 } from "uuid";
import type {
  CreateComponentOptions,
  CreateResponse,
  GetUploadMetadataResponse,
  MultiPartUploadPart,
} from "./types.js";
import normalizeString from "./util/normalize_string.js";
import { splitFileExtension } from "./util/split_file_extension.js";
import { getChunkSize } from "./util/get_chunk_size.js";
import { backOff } from "./util/back_off.js";

const logger = loglevel.getLogger("ftrack_api");

interface UploaderOptions extends CreateComponentOptions {
  onError?: (error: Error) => unknown;
  onComplete?: (componentId: string) => unknown;
}

declare global {
  interface Window {
    FTRACK_UPLOAD_MAX_CONNECTIONS?: number;
    FTRACK_UPLOAD_CHUNK_SIZE?: number;
  }
}

/**
 * Uploader - Creates components in the ftrack.server location, uploading file
 * data in single or multiple parts.
 *
 * Usage:
 *    const uploader = new Uploader(session, file, { onError, onComplete });
 *    uploader.start();
 *
 * Uploads are done in the following phases:
 *
 * 1. Preflight - A component is created and upload metadata is fetched using
 *    the Session. The response indicates if it is a single-part or multi-part
 *    upload.
 * 2. Data transfer - Data is transferred, either as a single part or in
 *    multiple *chunkSize* sized parts.
 * 3. Completion - Multi-part uploads are completed, the component is
 *    registered in the server location and an event is published.
 */
export class Uploader<TEntityTypeMap extends Record<string, any>> {
  /** Component id */
  componentId: string;
  /** Session instance */
  private session: Session<TEntityTypeMap>;
  /** File to upload */
  private file: Blob;
  /** Called on upload progress with percentage */
  private onProgress: UploaderOptions["onProgress"];
  /** Called when upload is aborted */
  private onAborted: UploaderOptions["onAborted"];
  /** Called on error */
  private onError: UploaderOptions["onError"];
  /** Called on upload completion */
  private onComplete: UploaderOptions["onComplete"];
  /** XHR for single-part upload. @deprecated */
  private xhr?: XMLHttpRequest;
  /** File type / extension */
  private fileType: string;
  /** File name */
  private fileName: string;
  /** File size in bytes */
  private fileSize: number;
  /** Number of parts for multi-part upload, or null for single-part upload */
  private numParts: number | null;
  /** Upload chunk (part) size in bytes */
  private chunkSize: number;
  /** Map of active XHR instances */
  private activeConnections: Record<number, XMLHttpRequest>;
  /** Maximum number of concurrent connections */
  private maxConcurrentConnections: number;
  /** URLs to for multi-part uploads */
  private parts: MultiPartUploadPart[];
  /** Completed parts */
  private uploadedParts: { e_tag: string; part_number: number }[];
  /** Server id for multi-part upload */
  private uploadId: string;
  /** Uploaded size */
  private uploadedSize: number;
  /** Number of bytes uploads */
  private progressCache: Record<number, number>;
  /** If upload request has been aborted */
  private aborted: boolean;
  /** Number of milliseconds a request can take before automatically being terminated. The default value is 0, which means there is no timeout. */
  private timeout: number;
  /** Additional data for Component entity */
  private data: CreateComponentOptions["data"];
  /** @deprecated - Remove once Session.createComponent signature is updated. */
  createComponentResponse: CreateResponse<
    TEntityTypeMap["FileComponent"]
  > | null;
  /** @deprecated - Remove once Session.createComponent signature is updated. */
  uploadMetadata: GetUploadMetadataResponse | null;
  /** @deprecated - Remove once Session.createComponent signature is updated. */
  createComponentLocationResponse: CreateResponse<
    TEntityTypeMap["ComponentLocation"]
  > | null;

  constructor(
    session: Session<TEntityTypeMap>,
    file: Blob,
    options: UploaderOptions,
  ) {
    this.session = session;
    this.file = file;
    const componentName = options.name ?? (file as File).name;
    let normalizedFileName;
    if (componentName) {
      normalizedFileName = normalizeString(componentName);
    }
    if (!normalizedFileName) {
      throw new CreateComponentError("Component name is missing.");
    }

    const fileNameParts = splitFileExtension(normalizedFileName);

    this.data = options.data || {};
    this.xhr = options.xhr;
    this.onProgress = options.onProgress;
    this.onAborted = options.onAborted;
    this.onError = options.onError;
    this.onComplete = options.onComplete;

    this.fileType = this.data.file_type || fileNameParts[1];
    this.fileName = this.data.name || fileNameParts[0];
    this.fileSize = this.data.size || file.size;

    this.componentId = this.data.id || uuidV4();

    this.maxConcurrentConnections =
      (typeof window !== "undefined" && window.FTRACK_UPLOAD_MAX_CONNECTIONS) ||
      6;
    this.chunkSize =
      (typeof window !== "undefined" && window.FTRACK_UPLOAD_CHUNK_SIZE) ||
      getChunkSize(this.fileSize);
    this.numParts = Math.ceil(this.fileSize / this.chunkSize);
    if (this.numParts <= 2) {
      this.numParts = null;
    }
    if (this.xhr) {
      logger.warn(
        "[session.createComponent] options.xhr is deprecated and not compatible with multi-part uploads, use options.signal for aborting uploads.",
      );
      this.numParts = null;
    }
    this.activeConnections = {};
    this.parts = [];
    this.uploadId = "";
    this.uploadedParts = [];
    this.uploadedSize = 0;
    this.progressCache = {};
    this.timeout = 0;
    this.aborted = false;

    this.createComponentResponse = null;
    this.uploadMetadata = null;
    this.createComponentLocationResponse = null;

    const handleAbortSignal = () => {
      this.abort();
      options.signal?.removeEventListener("abort", handleAbortSignal);
    };
    options.signal?.addEventListener("abort", handleAbortSignal);
  }

  /** Initiate upload. Promise is resolved once preflight is complete and upload started. */
  async start() {
    logger.debug("Upload starting", this.componentId);
    try {
      await this.uploadPreflight();
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      }
      return;
    }
    if (!this.uploadMetadata) {
      throw new Error("Failed to get upload metadata");
    }
    if ("urls" in this.uploadMetadata) {
      this.parts = this.uploadMetadata.urls;
      this.uploadId = this.uploadMetadata.upload_id;
      this.uploadNextChunk();
    } else {
      const { url, headers } = this.uploadMetadata;
      this.singlePartUpload({ url, headers });
    }
  }

  /** Create component entity and get upload metadata. */
  async uploadPreflight() {
    logger.debug("Registering component and fetching upload metadata.");

    const component = {
      ...this.data,
      id: this.componentId,
      name: this.fileName,
      file_type: this.fileType,
      size: this.fileSize,
    };
    const response = await this.session.call<
      [
        CreateResponse<TEntityTypeMap["FileComponent"]>,
        GetUploadMetadataResponse,
      ]
    >([
      operation.create("FileComponent", component),
      {
        action: "get_upload_metadata",
        file_name: `${this.fileName}${this.fileType}`,
        file_size: this.fileSize,
        component_id: this.componentId,
        parts: this.numParts,
      },
    ]);

    this.createComponentResponse = response[0];
    this.uploadMetadata = response[1];
  }

  /** Upload file using single-part upload. */
  async singlePartUpload({
    url,
    headers,
  }: {
    url: string;
    headers: Record<string, string>;
  }) {
    try {
      await backOff(async () => {
        if (!this.aborted) {
          await this.uploadFile({ url, headers });
          await this.completeUpload();
        }
      });
      logger.debug("Upload complete", this.componentId);
    } catch (error) {
      try {
        await this.cleanup();
      } catch (cleanupError) {
        logger.error("Clean up failed", cleanupError);
      }
      if (this.onError) {
        this.onError(error as Error);
      }
    }
  }

  /** Handle progress event for single-part upload */
  handleSinglePartProgress(
    progressEvent: ProgressEvent<XMLHttpRequestEventTarget>,
  ) {
    let progress = 0;

    if (progressEvent.lengthComputable) {
      progress = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
    }
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /** Recursively upload next chunk for multi-part upload. Calls complete upload when done. */
  async uploadNextChunk() {
    const activeConnections = Object.keys(this.activeConnections).length;
    if (activeConnections >= this.maxConcurrentConnections) {
      return;
    }

    if (!this.parts.length) {
      if (!activeConnections) {
        this.completeUpload();
      }
      return;
    }

    const part = this.parts.pop();
    if (!this.file || !part) {
      return;
    }

    const sentSize = (part.part_number - 1) * this.chunkSize;
    const chunk = this.file.slice(sentSize, sentSize + this.chunkSize);
    try {
      const onUploadChunkStart = () => {
        this.uploadNextChunk();
      };
      await backOff(async () => {
        if (!this.aborted) {
          await this.uploadChunk(chunk, part, onUploadChunkStart);
          this.uploadNextChunk();
        }
      });
    } catch (error) {
      logger.error(`Part #${part.part_number} failed to upload`);
      try {
        this.abort();
        await this.cleanup();
      } catch (cleanupError) {
        logger.error("Clean up failed", cleanupError);
      }
      if (this.onError) {
        this.onError(error as Error);
      }
    }
  }

  /** Upload *chunk* for *part*. Call *onUploadChunkStart* when started. */
  async uploadChunk(
    chunk: Blob,
    part: MultiPartUploadPart,
    onUploadChunkStart: () => void,
  ): Promise<void> {
    try {
      const status = await this.uploadFileChunk(
        chunk,
        part,
        onUploadChunkStart,
      );
      if (status !== 200) {
        throw new CreateComponentError(`Failed to upload file part: ${status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /** Handle progress event for multi-part *partNumber*. */
  handleChunkProgress(partNumber: number, event: ProgressEvent) {
    if (this.file) {
      if (
        event.type === "progress" ||
        event.type === "error" ||
        event.type === "abort"
      ) {
        this.progressCache[partNumber] = event.loaded;
      }

      if (event.type === "uploaded") {
        this.uploadedSize += this.progressCache[partNumber] || 0;
        delete this.progressCache[partNumber];
      }

      const inProgress = Object.keys(this.progressCache)
        .map(Number)
        .reduce((memo, id) => (memo += this.progressCache[id]), 0);

      const sent = Math.min(this.uploadedSize + inProgress, this.fileSize);

      const total = this.fileSize;

      const percentage = Math.floor((sent / total) * 100);
      if (this.onProgress) {
        this.onProgress(percentage);
      }
    }
  }

  /** Upload chunk for multi-part upload. */
  async uploadFileChunk(
    file: Blob,
    part: MultiPartUploadPart,
    onUploadChunkStart: () => void,
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const throwXHRError = (
        error: Error,
        part: MultiPartUploadPart,
        abortFn?: any,
      ) => {
        delete this.activeConnections[part.part_number - 1];
        reject(error);
        window.removeEventListener("offline", abortFn);
      };

      if (!window.navigator.onLine) {
        reject(
          new CreateComponentError(
            "Failed to upload, network is offline",
            "UPLOAD_FAILED_OFFLINE",
          ),
        );
        return;
      }

      const xhr = (this.activeConnections[part.part_number - 1] =
        new XMLHttpRequest());
      xhr.timeout = this.timeout;
      onUploadChunkStart();

      const progressListener = this.handleChunkProgress.bind(
        this,
        part.part_number - 1,
      );

      xhr.upload.addEventListener("progress", progressListener);
      xhr.addEventListener("error", progressListener);
      xhr.addEventListener("abort", progressListener);
      xhr.addEventListener("loadend", progressListener);

      xhr.open("PUT", part.signed_url);
      const abortXHR = () => xhr.abort();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const eTag = xhr.getResponseHeader("ETag");
          logger.debug(
            `Upload of part ${part.part_number} / ${this.numParts} complete`,
            eTag,
          );
          if (eTag) {
            const uploadedPart = {
              part_number: part.part_number,
              e_tag: eTag.replaceAll('"', ""),
            };

            this.uploadedParts.push(uploadedPart);

            resolve(xhr.status);
            delete this.activeConnections[part.part_number - 1];
            window.removeEventListener("offline", abortXHR);
          }
        }
      };

      xhr.onerror = () => {
        throwXHRError(
          new CreateComponentError(
            "Failed to upload file part",
            "UPLOAD_PART_FAILED",
          ),
          part,
          abortXHR,
        );
      };
      xhr.ontimeout = () => {
        throwXHRError(
          new CreateComponentError(
            "Failed to upload file part within timeout",
            "UPLOAD_PART_TIMEOUT",
          ),
          part,
          abortXHR,
        );
      };
      xhr.onabort = () => {
        throwXHRError(
          new CreateComponentError(
            "Upload aborted by client",
            "UPLOAD_ABORTED",
          ),
          part,
        );
      };
      window.addEventListener("offline", abortXHR);
      xhr.send(file);
    });
  }

  /** Single-part upload of file. */
  async uploadFile({
    url,
    headers,
  }: {
    url: string;
    headers: Record<string, string>;
  }) {
    logger.debug(`Uploading file to: ${url}`);

    return new Promise((resolve, reject) => {
      this.xhr = this.xhr ?? new XMLHttpRequest();
      this.xhr.upload.addEventListener(
        "progress",
        this.handleSinglePartProgress.bind(this),
      );
      this.xhr.open("PUT", url, true);
      this.xhr.onabort = async () => {
        this.aborted = true;
        if (this.onAborted) {
          this.onAborted();
        }
        reject(
          new CreateComponentError(
            "Upload aborted by client",
            "UPLOAD_ABORTED",
          ),
        );
      };
      this.xhr.onerror = async () => {
        reject(
          new CreateComponentError(
            `Failed to upload file: ${this.xhr!.status}`,
          ),
        );
      };
      this.xhr.onload = () => {
        if (this.xhr!.status >= 400) {
          reject(
            new CreateComponentError(
              `Failed to upload file: ${this.xhr!.status}`,
            ),
          );
        }
        resolve(this.xhr!.response);
      };

      for (const key in headers) {
        if (headers.hasOwnProperty(key) && key !== "Content-Length") {
          this.xhr.setRequestHeader(key, headers[key]);
        }
      }
      this.xhr.send(this.file);
    });
  }

  /** Complete upload, register component in server location and publish ftrack.location.component-added. Calls onComplete when done.  */
  async completeUpload() {
    logger.debug("Completing upload");
    const operations = [];

    if (this.uploadedParts.length) {
      this.uploadedParts.sort((a, b) => a.part_number - b.part_number);
      operations.push({
        action: "complete_multipart_upload",
        upload_id: this.uploadId,
        parts: this.uploadedParts,
        component_id: this.componentId,
      });
    }

    operations.push(
      operation.create("ComponentLocation", {
        id: uuidV4(),
        component_id: this.componentId,
        resource_identifier: this.componentId,
        location_id: SERVER_LOCATION_ID,
      }),
    );

    const response =
      await this.session.call<
        CreateResponse<TEntityTypeMap["ComponentLocation"]>
      >(operations);
    this.createComponentLocationResponse = response[response.length - 1];

    // Emit event so that clients can perform additional work on uploaded
    // component (such as custom encoding).
    if (this.session.eventHub.isConnected()) {
      this.session.eventHub.publish(
        new Event("ftrack.location.component-added", {
          component_id: this.componentId,
          location_id: SERVER_LOCATION_ID,
        }),
      );
    }

    logger.debug("Upload complete");
    if (this.onComplete) {
      this.onComplete(this.componentId);
    }
  }

  /** Abort upload request(s) */
  abort() {
    this.aborted = true;
    logger.debug("Aborting upload", this.componentId);
    if (this.xhr) {
      this.xhr.abort();
    }

    const connections = Object.keys(this.activeConnections).map(Number);

    connections.forEach((id) => {
      this.activeConnections[id].abort();
    });

    if (connections.length && this.onAborted) {
      this.onAborted();
    }
  }

  /** Clean-up failed uploads by deleting `FileComponent`. */
  async cleanup() {
    logger.debug("Cleaning up", this.componentId);
    await this.session.delete("FileComponent", [this.componentId]);
    logger.debug("Clean up complete");
  }
}
