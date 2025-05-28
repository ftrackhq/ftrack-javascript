// :copyright: Copyright (c) 2022 ftrack

import { convertToIsoString } from "../source/util/convert_to_iso_string.js";
import dayjs from "dayjs";
import { describe, it, expect } from "vitest";

describe("convertToIsoString", () => {
  it("should convert date object to ISO", () => {
    const isoDate = "2023-01-01T00:00:00.000Z";
    const date = new Date(isoDate);
    const converted = convertToIsoString(date);
    expect(converted).toEqual(isoDate);
  });

  it("should return ISO in UTC to itself", () => {
    const isoDate = "2023-01-01T00:00:00.000Z";
    const date = new Date(isoDate);
    const converted = convertToIsoString(date);
    expect(converted).toEqual(isoDate);
  });

  it("should convert ISO string with other timezone to UTC", () => {
    const tzDate = "2023-01-01T01:00:00+01:00";
    const isoDate = "2023-01-01T00:00:00.000Z";
    const converted = convertToIsoString(tzDate);
    expect(converted).toEqual(isoDate);
  });

  it("should convert dayjs objects to ISO strings", () => {
    const tzDate = "2023-01-01T01:00:00+01:00";
    const isoDate = "2023-01-01T00:00:00.000Z";
    const converted = convertToIsoString(dayjs(tzDate));
    expect(converted).toEqual(isoDate);
  });

  it.each([
    "2023-01-01T00:00:00",
    "2023-01-01T00:00:00Z",
    "2023-01-01T00:00:00z",
    "2023-01-01T00:00:00.000Z",
    "2023-01-01T00:00:00.000z",
    "2023-01-01T00:00:00.000+00:00",
    "2023-01-01T00:00:00.000+01:00",
    "2023-01-01T00:00:00+01:00",
    "2023-01-01T00:00:00.000-01:00",
  ])("should allow for variations in ms and timezone: %s", (validDate) => {
    const converted = convertToIsoString(validDate);
    const dayjsConverted = dayjs(validDate).toISOString();
    expect(converted).toEqual(dayjsConverted);
  });

  it.each(["2023", "2023-01", "2023-01-01", "2023-W01-01", "2023-01-01T00:00"])(
    "should not match incomplete date-times",
    (invalidDate) => {
      const converted = convertToIsoString(invalidDate);
      expect(converted).toEqual(null);
    },
  );

  it.each([
    "hello world",
    "202f",
    "ffff",
    "1",
    "2",
    "20",
    1,
    -1,
    0,
    null,
    undefined,
    new Date("hello world"),
    NaN,
  ])("should return null for invalid ISO string: %s", (invalidDate) => {
    const converted = convertToIsoString(invalidDate as any); //casted to test for invalid type
    expect(converted).toEqual(null);
  });
});
