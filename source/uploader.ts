// :copyright: Copyright (c) 2023 ftrack

import loglevel from "loglevel";
import { Event, operation } from "./index.js";
import { SERVER_LOCATION_ID } from "./constant.js";
import { CreateComponentError } from "./error.js";
import { Session } from "./session.js";
import { v4 as uuidV4 } from "uuid";
import {
  CreateComponentOptions,
  CreateResponse,
  GetUploadMetadataResponse,
} from "./types.js";
import normalizeString from "./util/normalize_string.js";
import { splitFileExtension } from "./util/split_file_extension.js";
import type { Data } from "./types.js";

const logger = loglevel.getLogger("ftrack_api");

export class Uploader {
  session: Session;
  file: Blob;
  onProgress: ((progress: number) => unknown) | null;
  onAborted: (() => void) | null;
  xhr: XMLHttpRequest;
  fileType: string;
  fileName: string;
  fileSize: number;
  componentId: string;
  componentLocationId: string;
  data: CreateComponentOptions["data"];
  createComponentResponse: CreateResponse<Data> | null;
  uploadMetadata: GetUploadMetadataResponse | null;
  createComponentLocationResponse: CreateResponse<Data> | null;

  constructor(session: Session, file: Blob, options: CreateComponentOptions) {
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

    if (options.xhr) {
      logger.warn(
        "[session.createComponent] options.xhr is deprecated, use options.signal for aborting uploads."
      );
    }

    this.data = options.data || {};
    this.onProgress = options.onProgress ?? null;
    this.xhr = options.xhr || new XMLHttpRequest();
    this.onAborted = options.onAborted ?? null;

    this.fileType = this.data.file_type || fileNameParts[1];
    this.fileName = this.data.name || fileNameParts[0];
    this.fileSize = this.data.size || file.size;
    this.componentId = this.data.id || uuidV4();
    this.componentLocationId = uuidV4();

    this.createComponentResponse = null;
    this.uploadMetadata = null;
    this.createComponentLocationResponse = null;

    const handleAbortSignal = () => {
      this.abort();
      options.signal?.removeEventListener("abort", handleAbortSignal);
    };
    options.signal?.addEventListener("abort", handleAbortSignal);
  }

  async upload() {
    logger.debug("Upload starting", this.componentId);
    await this.uploadPreflight();
    await this.uploadFile();
    await this.completeUpload();
    logger.debug("Upload complete", this.componentId);
  }

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
      [CreateResponse, GetUploadMetadataResponse]
    >([
      operation.create("FileComponent", component),
      {
        action: "get_upload_metadata",
        file_name: `${this.fileName}${this.fileType}`,
        file_size: this.fileSize,
        component_id: this.componentId,
      },
    ]);

    this.createComponentResponse = response[0];
    this.uploadMetadata = response[1];
  }

  handleXhrProgress(progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) {
    let progress = 0;

    if (progressEvent.lengthComputable) {
      progress = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
    }
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  async uploadFile() {
    if (!this.uploadMetadata) {
      throw new Error("Upload metadata not resolved");
    }
    const { url, headers } = this.uploadMetadata;
    logger.debug(`Uploading file to: ${url}`);

    const promise = new Promise((resolve, reject) => {
      this.xhr.upload.addEventListener(
        "progress",
        this.handleXhrProgress.bind(this)
      );
      this.xhr.open("PUT", url, true);
      this.xhr.onabort = async () => {
        if (this.onAborted) {
          this.onAborted();
        }
        await this.cleanup();
        reject(
          new CreateComponentError("Upload aborted by client", "UPLOAD_ABORTED")
        );
      };
      this.xhr.onerror = async () => {
        await this.cleanup();
        reject(
          new CreateComponentError(`Failed to upload file: ${this.xhr.status}`)
        );
      };
      this.xhr.onload = () => {
        if (this.xhr.status >= 400) {
          reject(
            new CreateComponentError(
              `Failed to upload file: ${this.xhr.status}`
            )
          );
        }
        resolve(this.xhr.response);
      };

      for (const key in headers) {
        if (headers.hasOwnProperty(key) && key !== "Content-Length") {
          this.xhr.setRequestHeader(key, headers[key]);
        }
      }
      this.xhr.send(this.file);
    });

    await promise;
  }

  async completeUpload() {
    logger.debug("Completing upload");
    const createComponentLocationOperation = operation.create(
      "ComponentLocation",
      {
        id: this.componentLocationId,
        component_id: this.componentId,
        resource_identifier: this.componentId,
        location_id: SERVER_LOCATION_ID,
      }
    );

    const response = await this.session.call<CreateResponse>([
      createComponentLocationOperation,
    ]);
    this.createComponentLocationResponse = response[0];

    // Emit event so that clients can perform additional work on uploaded
    // component (such as custom encoding).
    this.session.eventHub.publish(
      new Event("ftrack.location.component-added", {
        component_id: this.componentId,
        location_id: SERVER_LOCATION_ID,
      })
    );
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

  async cleanup() {
    await this.session.delete("FileComponent", [this.componentId]);
  }
}
