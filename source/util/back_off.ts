// :copyright: Copyright (c) 2023 ftrack
import loglevel from "loglevel";
const logger = loglevel.getLogger("ftrack_api");

const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Allows retrying a function *request*, with an exponential delay between attempts */
export async function backOff<T>(
  request: () => Promise<T>,
  /** Maximum number of attempts to attempt before giving up */
  maxAttempts = 16,
  /** Maximum delay between attempts [64 seconds] */
  maxDelayMs = 64 * 1000,
  /** Fuzz/Jitter each attempt by [0-fuzzMs] ms */
  fuzzMs = 500
) {
  let attemptNumber = 0;
  let delayMs = 500;
  let delayFuzzMs = 0;

  while (attemptNumber <= maxAttempts) {
    try {
      return await request();
    } catch (error) {
      attemptNumber += 1;
      if (attemptNumber >= maxAttempts) {
        logger.warn(`Failed to execute function in ${maxAttempts} attempts.`);
        throw error;
      }
      delayMs = Math.min(maxDelayMs, delayMs * 2);
      delayFuzzMs = Math.floor(Math.random() * fuzzMs);

      logger.warn(
        `Failed to execute function, retrying in ${Math.floor(
          delayMs / 1000
        )} seconds...`
      );
      await sleep(delayMs + delayFuzzMs);
    }
  }
  throw new Error("Something went wrong");
}
