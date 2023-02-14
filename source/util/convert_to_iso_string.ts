function isIsoDate(str: string) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString() === str; // valid date
}

export function convertToISOString(data: string | Date) {
  if (
    data &&
    // if this is a date object of type moment or dayjs, or regular date object (all of them has toISOString)
    ((typeof data !== "string" && typeof data.toISOString === "function") ||
      // if it's a ISO string already
      (typeof data == "string" && isIsoDate(data)))
  ) {
    // wrap it new Date() to convert it to UTC based ISO string in case it is in another timezone
    return new Date(data).toISOString();
  }

  return null;
}
