// :copyright: Copyright (c) 2018 ftrack

function encodeUriParameters(data) {
  return Object.keys(data)
    .map((key) => [key, data[key]].map(encodeURIComponent).join("="))
    .join("&");
}

export default encodeUriParameters;
