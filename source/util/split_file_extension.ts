// :copyright: Copyright (c) 2023 ftrack
/**
 * Split filename into basename and extension.
 *
 * @param  {fileName} The name of the file.
 * @return {array} Array with [basename, extension] from filename.
 */
export function splitFileExtension(fileName: string) {
  let basename = fileName || "";
  let extension =
    fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1) ||
    "";

  if (extension.length) {
    extension = `.${extension}`;
    basename = fileName.slice(0, -1 * extension.length) || "";
  }

  return [basename, extension];
}
