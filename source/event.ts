// :copyright: Copyright (c) 2016 ftrack
import { v4 as uuidV4 } from "uuid";

/**
 * ftrack API Event class.
 */
export class Event {
  private readonly _data: {
    topic: string;
    data: object;
    target: string;
    inReplyToEvent: string | null;
    id: string;
    source?: any;
  };

  /**
   * Construct Event instance with *topic*, *data* and additional *options*.
   *
   * *topic* should be a string representing the event.
   *
   * *data* should be an object with the event payload.
   */
  constructor(
    topic: string,
    data: object,
    options: { [key: string]: object } = {}
  ) {
    this._data = {
      topic,
      data,
      target: "",
      inReplyToEvent: null,
      ...options,
      id: uuidV4(),
    };
  }

  /** Return event data. */
  getData(): { [key: string]: any } {
    return this._data;
  }

  /** Add source to event data. */
  addSource(source: any): void {
    this._data.source = source;
  }
}
