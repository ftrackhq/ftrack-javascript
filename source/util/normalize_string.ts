// :copyright: Copyright (c) 2019 ftrack
import log from "loglevel";

function normalizeString(value: string) {
  let result = value;
  try {
    result = value.normalize();
  } catch (error) {
    log.warn("Failed to normalize string", value, error);
  }

  return result;
}

export default normalizeString;
