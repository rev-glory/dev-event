import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

// Event domain type (no mongoose-specific fields)
export interface IEvent {
  title: string;
  slug: string; // URL-friendly unique identifier derived from title
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // 24h time (HH:mm)
  mode: string; // e.g., online | offline | hybrid
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type EventModel = Model<IEvent>;

// Create a URL-safe slug from a title (lowercase, hyphenated, trimmed)
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '') // drop quotes
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> '-'
    .replace(/^-+|-+$/g, '') // trim leading/trailing '-'
    .replace(/-+/g, '-'); // collapse multiple '-'
}

// Normalize to ISO calendar date (YYYY-MM-DD). Returns null if invalid.
function toISODate(value: string): string | null {
  const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return ymd[0];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Use UTC to avoid TZ drift
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Normalize time to HH:mm (24h). Supports 24h, optional seconds, and am/pm.
function toHHmm(value: string): string | null {
  const v = value.trim().toLowerCase();
  // 24h formats like H:MM, HH:MM, HH:MM:SS
  let m = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h >= 0 && h < 24 && min >= 0 && min < 60) return `${`${h}`.padStart(2, '0')}:${`${min}`.padStart(2, '0')}`;
    return null;
  }
  // 12h formats like H:MM am/pm
  m = v.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const meridiem = m[3];
    if (!(h >= 1 && h <= 12 && min >= 0 && min < 60)) return null;
    if (meridiem === 'pm' && h !== 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    return `${`${h}`.padStart(2, '0')}:${`${min}`.padStart(2, '0')}`;
  }
  // Compact 4-digit 24h e.g. 0900 or 1730
  m = v.match(/^(\d{2})(\d{2})$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h >= 0 && h < 24 && min >= 0 && min < 60) return `${`${h}`.padStart(2, '0')}:${`${min}`.padStart(2, '0')}`;
  }
  return null;
}

const EventSchema = new Schema<IEvent, EventModel>(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    overview: { type: String, required: [true, 'Overview is required'], trim: true },
    image: { type: String, required: [true, 'Image is required'], trim: true },
    venue: { type: String, required: [true, 'Venue is required'], trim: true },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    date: { type: String, required: [true, 'Date is required'], trim: true },
    time: { type: String, required: [true, 'Time is required'], trim: true },
    mode: { type: String, required: [true, 'Mode is required'], trim: true },
    audience: { type: String, required: [true, 'Audience is required'], trim: true },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.trim().length > 0),
        message: 'Agenda must be a non-empty array of strings',
      },
    },
    organizer: { type: String, required: [true, 'Organizer is required'], trim: true },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.trim().length > 0),
        message: 'Tags must be a non-empty array of strings',
      },
    },
  },
  { timestamps: true, versionKey: false }
);

// Unique index for slug for fast lookups and enforcement
EventSchema.index({ slug: 1 }, { unique: true });

// Pre-save: generate slug (only when title changes), normalize date/time, and ensure non-empty required values.
EventSchema.pre('save', function (this: HydratedDocument<IEvent>, next) {
  // Title -> slug (only re-generate if title changed)
  if (this.isModified('title')) {
    const newSlug = slugify(this.title);
    if (!newSlug) return next(new Error('Failed to generate slug from title'));
    this.slug = newSlug;
  }

  // Normalize and validate the date (to YYYY-MM-DD)
  const isoDate = toISODate(this.date);
  if (!isoDate) return next(new Error('Invalid date; expected a valid calendar date'));
  this.date = isoDate;

  // Normalize and validate the time (to HH:mm)
  const hhmm = toHHmm(this.time);
  if (!hhmm) return next(new Error('Invalid time; expected 24h HH:mm or a common time format'));
  this.time = hhmm;

  // Extra guard: ensure core required string fields are non-empty after trim
  const requiredStrings: Array<keyof Pick<IEvent, 'title' | 'description' | 'overview' | 'image' | 'venue' | 'location' | 'mode' | 'audience' | 'organizer'>> = [
    'title',
    'description',
    'overview',
    'image',
    'venue',
    'location',
    'mode',
    'audience',
    'organizer',
  ];
  for (const key of requiredStrings) {
    const val = this[key];
    if (typeof val !== 'string' || val.trim().length === 0) {
      return next(new Error(`${String(key)} is required`));
    }
  }

  return next();
});

// Prevent model overwrite in dev/hot-reload environments
export const Event: EventModel = (mongoose.models.Event as EventModel) || mongoose.model<IEvent>('Event', EventSchema);
