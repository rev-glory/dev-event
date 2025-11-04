import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database/event.model";
import {cacheLife} from "next/cache";

const BASE_URL =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}` // production (Vercel)
    : process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL    // manual env (with protocol)
    : 'http://localhost:3000';            // local fallback


const Page = async () => {
    'use cache';
    cacheLife('minutes')
    const response = await fetch(`${BASE_URL}/api/events`, {
      next: { revalidate: 60 },
    });

    const { events } = await response.json();

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events && events.length > 0 && events.map((event: IEvent) => (
                        <li key={event.title} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default Page;