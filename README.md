# DevEvent

A web platform for discovering and booking developer events — hackathons, meetups, and conferences — built with Next.js (App Router) and TypeScript.

## Features

- **Event discovery** — browse featured hackathons, meetups, and conferences on the homepage, with event cards showing location, date, and time.
- **Event detail pages** — dynamic routes (`/events/[slug]`) showing full event overview, venue, agenda, organizer, and tags.
- **Event booking** — visitors can register interest in an event via email; bookings are validated and linked to the event in the database.
- **Event creation** — events can be created with image upload (via Cloudinary), tags, and a structured agenda.
- **Related events** — events are matched and surfaced based on shared tags.
- **Analytics** — integrated with PostHog for usage tracking.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, custom components (shadcn-style component structure)
- **Database:** MongoDB with Mongoose — schemas include validation, auto-generated slugs, and normalized date/time formats
- **Media:** Cloudinary for event image uploads
- **Analytics:** PostHog

## Architecture Notes

- Server Actions (`lib/actions/`) handle data mutations like bookings and related-event queries.
- API routes (`app/api/events/`) handle event creation (with image upload) and listing.
- Mongoose models enforce data integrity at the schema level — e.g. slugs are auto-generated from titles, dates/times are normalized on save, and bookings validate that the referenced event exists before being created.
- Reusable, composable UI components (`EventCard`, `EventDetails`, `BookEvent`, `NavBar`, etc.) following a component-driven structure.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment variables

You'll need a MongoDB connection string and Cloudinary credentials configured in `.env.local` to run event creation and image upload locally.
