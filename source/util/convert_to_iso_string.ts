/**
 * Checks if string is in ISO 6801 format.
 */
function isIsoDate(str: string) {
  return /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/.test(
    str
  );
}

/**
 * Converts a string or date object to ISO 6801 compatible string.
 * Supports converting regular date objects, or any object that has toISOString() method such as moment or dayjs.
 *
 * @param data - string or date object
 * @returns ISO 6801 compatible string, or null if invalid date
 */
export function convertToIsoString(data: string | Date) {
  if (
    data &&
    // if this is a date object of type moment or dayjs, or regular date object (all of them has toISOString)
    ((typeof data !== "string" && typeof data.toISOString === "function") ||
      // if it's a ISO string already
      (typeof data == "string" && isIsoDate(data)))
  ) {
    // wrap it new Date() to convert it to UTC based ISO string in case it is in another timezone
    try {
      return new Date(data).toISOString();
    } catch (err) {
      return null;
    }
  }

  return null;
}
