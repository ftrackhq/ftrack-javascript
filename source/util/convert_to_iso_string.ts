import type { Moment } from "moment";
import type dayjs from "dayjs";

/**
 * Checks if string is in ISO 6801 format including time and optionally
 * milliseconds and timezone.
 *
 * Matches:
 *   - YYYY-MM-DDThh:mm:ss
 *   - YYYY-MM-DDThh:mm:ssTZD
 *   - YYYY-MM-DDThh:mm:ss.sTZD
 */
function isIsoDate(str: string) {
  return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i.test(
    str,
  );
}

/**
 * Converts a string or date object to ISO 6801 compatible string.
 * Supports converting regular date objects, or any object that has toISOString() method such as moment or dayjs.
 *
 * @param data - string or date object
 * @returns ISO 6801 compatible string, or null if invalid date
 */
export function convertToIsoString(
  data: string | Date | Moment | ReturnType<typeof dayjs>,
) {
  if (
    data &&
    // if this is a date object of type moment or dayjs, or regular date object (all of them has toISOString)
    ((typeof data !== "string" && typeof data.toISOString === "function") ||
      // if it's a ISO string already
      (typeof data == "string" && isIsoDate(data)))
  ) {
    // wrap it new Date() to convert it to UTC based ISO string in case it is in another timezone
    try {
      return new Date(data as any).toISOString();
    } catch (err) {
      return null;
    }
  }

  return null;
}
