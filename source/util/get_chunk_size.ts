// :copyright: Copyright (c) 2023 ftrack

const MAX_PARTS = 10000;

/** Return chunk size for multi-part upload based on *fileSize*. */
export function getChunkSize(fileSize: number): number {
  const megabytes = 1024 * 1024;
  const gigabytes = 1024 * 1024 * 1024;
  const maxFileSize = 128 * megabytes * MAX_PARTS;

  if (fileSize > maxFileSize) {
    throw new Error("File is larger than the maximum allowed (1,280 GB)");
  }

  if (fileSize > 64 * gigabytes) {
    return 128 * megabytes;
  }
  if (fileSize > 8 * gigabytes) {
    return 64 * megabytes;
  }
  if (fileSize > 1 * gigabytes) {
    return 32 * megabytes;
  }
  if (fileSize > 128 * megabytes) {
    return 16 * megabytes;
  }

  return 8 * megabytes;
}
