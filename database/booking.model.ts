import mongoose, { HydratedDocument, Model, Schema, Types } from 'mongoose';
import { Event } from './event.model';

export interface IBooking {
  eventId: Types.ObjectId; // Reference to Event
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BookingModel = Model<IBooking>;

// Basic RFC 5322-compatible email regex (kept pragmatic for server-side validation)
const EMAIL_RE = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)]$)/i;

const BookingSchema = new Schema<IBooking, BookingModel>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => EMAIL_RE.test(v),
        message: 'Email is not valid',
      },
    },
  },
  { timestamps: true, versionKey: false }
);

// Pre-save: ensure referenced Event exists; prevents orphan bookings.
BookingSchema.pre('save', async function (this: HydratedDocument<IBooking>, next) {
  try {
    const exists = await Event.exists({ _id: this.eventId });
    if (!exists) return next(new Error('Referenced event does not exist'));
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

// Explicit index for eventId to optimize lookups by event
BookingSchema.index({ eventId: 1 });

// Prevent model overwrite in dev/hot-reload environments
export const Booking: BookingModel = (mongoose.models.Booking as BookingModel) || mongoose.model<IBooking>('Booking', BookingSchema);
