import EventCard from '@/components/EventCard';
import ExploreBtn from '@/components/ExploreBtn';
import { IEvent } from '@/database/event.model';
import { cacheLife } from 'next/cache';

const Page = async () => {
  'use cache';
  cacheLife('minutes');

  const response = await fetch('/api/events', {
    next: { revalidate: 60 },
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
