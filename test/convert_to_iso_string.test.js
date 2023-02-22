// :copyright: Copyright (c) 2022 ftrack

import { convertToIsoString } from "../source/util/convert_to_iso_string";
import moment from "moment";
import dayjs from "dayjs";

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

  it("should convert moment objects to ISO strings in UTC", () => {
    const tzDate = "2023-01-01T01:00:00+01:00";
    const isoDate = "2023-01-01T00:00:00.000Z";
    const converted = convertToIsoString(moment(tzDate));
    expect(converted).toEqual(isoDate);
  });

  it("should convert dayjs objects to ISO strings", () => {
    const tzDate = "2023-01-01T01:00:00+01:00";
    const isoDate = "2023-01-01T00:00:00.000Z";
    const converted = convertToIsoString(dayjs(tzDate));
    expect(converted).toEqual(isoDate);
  });

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
    const converted = convertToIsoString(invalidDate);
    expect(converted).toEqual(null);
  });
});
