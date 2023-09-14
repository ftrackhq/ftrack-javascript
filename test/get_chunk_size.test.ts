// :copyright: Copyright (c) 2023 ftrack
import { getChunkSize } from "../source/util/get_chunk_size";
import { describe, expect, it } from "vitest";

describe("getChunkSize", () => {
  it("should return the correct chunk size for a given file size", () => {
    let fileSize = 1 * 1024 * 1024; // 1 MB
    let result = getChunkSize(fileSize);
    expect(result).toEqual(8 * 1024 * 1024); // 8 MB

    fileSize = 100 * 1024 * 1024; // 100 MB
    result = getChunkSize(fileSize);
    expect(result).toEqual(8 * 1024 * 1024); // 8 MB

    fileSize = 500 * 1024 * 1024; // 500 MB
    result = getChunkSize(fileSize);
    expect(result).toEqual(16 * 1024 * 1024); // 16 MB

    fileSize = 2 * 1024 * 1024 * 1024; // 2 GB
    result = getChunkSize(fileSize);
    expect(result).toEqual(32 * 1024 * 1024); // 32 MB

    fileSize = 10 * 1024 * 1024 * 1024; // 10 GB
    result = getChunkSize(fileSize);
    expect(result).toEqual(64 * 1024 * 1024); // 64 MB

    fileSize = 500 * 1024 * 1024 * 1024; // 100 GB
    result = getChunkSize(fileSize);
    expect(result).toEqual(128 * 1024 * 1024); // 128 MB

    // File size is larger than the maximum allowed
    fileSize = 1500 * 1024 * 1024 * 1024; // 1500 GB
    expect(() => getChunkSize(fileSize)).toThrowError(
      "File is larger than the maximum allowed (1,280 GB)",
    );
  });
});
