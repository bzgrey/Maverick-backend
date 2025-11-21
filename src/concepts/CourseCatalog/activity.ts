import type { Class } from "./class.ts";

import { Slot } from "./dates.ts";
// import { sum } from "./utils";

/** A period of time, spanning several Slots. */
export class Timeslot {
  startSlot: Slot;
  numSlots: number;

  constructor(startSlot: number, numSlots: number) {
    this.startSlot = Slot.fromSlotNumber(startSlot);
    this.numSlots = numSlots;
  }

  /** Construct a timeslot from [startSlot, endSlot). */
  static fromStartEnd(startSlot: Slot, endSlot: Slot): Timeslot {
    return new Timeslot(startSlot.slot, endSlot.slot - startSlot.slot);
  }

  /** The first slot after this Timeslot, or the exclusive end slot. */
  get endSlot(): Slot {
    return this.startSlot.add(this.numSlots);
  }

  /** The start time, on the week of 2001-01-01. */
  get startTime(): Date {
    return this.startSlot.startDate;
  }

  /** The end time, on the week of 2001-01-01. */
  get endTime(): Date {
    return this.endSlot.startDate;
  }

  /** The number of hours this timeslot spans. */
  get hours(): number {
    return this.numSlots / 2;
  }

  /**
   * @param other - timeslot to compare to
   * @returns True if this timeslot conflicts with the other timeslot
   */
  conflicts(other: Timeslot): boolean {
    return (
      this.startSlot.slot < other.endSlot.slot &&
      other.startSlot.slot < this.endSlot.slot
    );
  }

  /** Convert to string of the form "Mon, 9:30 AM – 11:00 AM". */
  toString(): string {
    return `${this.startSlot.dayString}, ${this.startSlot.timeString} – ${this.endSlot.timeString}`;
  }

  /** @returns True if this timeslot is equal to other timeslot */
  equals(other: Timeslot): boolean {
    return this.startSlot === other.startSlot && this.endSlot === other.endSlot;
  }
}

/**
 * A group of events to be rendered in a calendar, all of the same name, room,
 * and color.
 */
export class Event {
  /** The parent activity owning the event. */
  activity: Activity;
  /** The name of the event. */
  name: string;
  /** All slots of the event. */
  slots: Timeslot[];
  /** The room of the event. */
  room: string | undefined;
  /** If defined, 1 -> first half; 2 -> second half. */
  half: number | undefined;

  constructor(
    activity: Activity,
    name: string,
    slots: Timeslot[],
    room: string | undefined = undefined,
    half: number | undefined = undefined,
  ) {
    this.activity = activity;
    this.name = name;
    this.slots = slots;
    this.room = room;
    this.half = half;
  }

  // /** List of events that can be directly given to FullCalendar. */
  // get eventInputs(): EventInput[] {
  //   const color = this.activity.backgroundColor;
  //   return this.slots.map((slot) => ({
  //     textColor: textColor(color),
  //     title: this.name,
  //     start: slot.startTime,
  //     end: slot.endTime,
  //     backgroundColor: color,
  //     borderColor: color,
  //     room: this.room,
  //     activity: this.activity,
  //   }));
  // }
}

/** Shared interface for Class */
export type Activity = Class;
