// :copyright: Copyright (c) 2018 ftrack

function encodeUriParameters(data: { [key: string]: string | number }): string {
  return Object.keys(data)
    .map((key) => [key, data[key]].map(encodeURIComponent).join("="))
    .join("&");
}

export default encodeUriParameters;
