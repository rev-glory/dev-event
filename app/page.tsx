import EventCard from '@/components/EventCard';
import ExploreBtn from '@/components/ExploreBtn';
import { IEvent } from '@/database/event.model';
import { cacheLife } from 'next/cache';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'http://localhost:3000';

const Page = async () => {
  'use cache';
  cacheLife('minutes');

  // ✅ Always use absolute URL when fetching during build/SSR
  const response = await fetch(`${BASE_URL}/api/events`, {
    next: { revalidate: 60 }, // optional: cache revalidation
  });

  if (!response.ok) {
    console.error('Failed to fetch events:', response.statusText);
    return <p className="text-center mt-10">Failed to load events.</p>;
  }

  const { events } = await response.json();

  return (
    <section>
      <h1 className="text-center">
        The hub for Every dev<br />Event You Can't Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, and Conferences, All in One Place
      </p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events list-none">
          {events?.length > 0 ? (
            events.map((event: IEvent) => (
              <li key={event.slug}>
                <EventCard {...event} />
              </li>
            ))
          ) : (
            <p>No events found.</p>
          )}
        </ul>
      </div>
    </section>
  );
};

export default Page;
