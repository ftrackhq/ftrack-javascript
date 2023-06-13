import { splitFileExtension } from "../source/util/split_file_extension";
describe("splitFileExtension", () => {
  it("should split filename into basename and extension", () => {
    const fileName = "example.txt";
    const result = splitFileExtension(fileName);
    expect(result).toEqual(["example", ".txt"]);
  });

  it("should handle filename without extension", () => {
    const fileName = "no_extension";
    const result = splitFileExtension(fileName);
    expect(result).toEqual(["no_extension", ""]);
  });

  it("should handle empty filename", () => {
    const fileName = "";
    const result = splitFileExtension(fileName);
    expect(result).toEqual(["", ""]);
  });

  it("should handle filename starting with dot", () => {
    const fileName = ".htaccess";
    const result = splitFileExtension(fileName);
    expect(result).toEqual([".htaccess", ""]);
  });

  it("should handle filename with multiple dots", () => {
    const fileName = "archive.tar.gz";
    const result = splitFileExtension(fileName);
    expect(result).toEqual(["archive.tar", ".gz"]);
  });

  it("should handle filename with dot at the beginning and no extension", () => {
    const fileName = ".";
    const result = splitFileExtension(fileName);
    expect(result).toEqual([".", ""]);
  });

  it("should handle filename with dot at the end and no extension", () => {
    const fileName = "file.";
    const result = splitFileExtension(fileName);
    expect(result).toEqual(["file.", ""]);
  });

  it("should handle filename with dot in the middle and no extension", () => {
    const fileName = "file.with.dot.";
    const result = splitFileExtension(fileName);
    expect(result).toEqual(["file.with.dot.", ""]);
  });

  it("should handle filename with dot in the middle and an extension", () => {
    const fileName = "file.with.dot.txt";
    const result = splitFileExtension(fileName);
    expect(result).toEqual(["file.with.dot", ".txt"]);
  });

  it("should handle filename with dot at the beginning and an extension", () => {
    const fileName = ".htaccess.txt";
    const result = splitFileExtension(fileName);
    expect(result).toEqual([".htaccess", ".txt"]);
  });
});
