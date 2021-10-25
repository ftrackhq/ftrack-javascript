// :copyright: Copyright (c) 2016 ftrack
import uuidV4 from "uuid/v4";

/**
 * ftrack API Event class.
 */
export class Event {
  /**
   * Construct Event instance with *topic*, *data* and additional *options*.
   *
   * *topic* should be a string representing the event.
   *
   * *data* should be an object with the event payload.
   */
  constructor(topic, data, options = {}) {
    this._data = Object.assign(
      {
        topic,
        data,
        target: "",
        inReplyToEvent: null,
      },
      options,
      {
        id: uuidV4(),
        sent: null,
      }
    );
  }

  /** Return event data. */
  getData() {
    return this._data;
  }

  /** Add source to event data. */
  addSource(source) {
    this._data.source = source;
  }
}

export default Event;
