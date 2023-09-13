// :copyright: Copyright (c) 2023 ftrack
import { backOff } from "../source/util/back_off";
import { describe, it, expect } from "vitest";

describe("backOff", () => {
  it("should return the result of the successful request", async () => {
    let attempts = 0;
    const successfulRequest = async () => {
      attempts++;
      return "Success";
    };
    const result = await backOff(successfulRequest, 3, 0, 0);
    expect(result).toBe("Success");
    expect(attempts).toBe(1);
  });

  it("should retry the request and throw an error if all attempts fail", async () => {
    let attempts = 0;
    const failingRequest = async () => {
      attempts += 1;
      throw new Error("Request failed");
    };

    await expect(backOff(failingRequest, 3, 0, 0)).rejects.toThrow(
      "Request failed",
    );
    expect(attempts).toBe(3);
  });

  it("should retry the request and succeed after a failed attempt", async () => {
    let attempts = 0;
    const successfulAfterAttempt = async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("First attempt failed");
      }
      return "Success";
    };

    const result = await backOff(successfulAfterAttempt, 3, 0, 0);
    expect(result).toBe("Success");
    expect(attempts).toBe(2);
  });
});
