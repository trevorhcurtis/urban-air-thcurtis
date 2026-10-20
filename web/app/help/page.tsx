import Link from "next/link";
import { Disclosure } from "@/components/ui/Disclosure";
import { Heading } from "@/components/ui/Heading";

export const metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Heading level={1} size={2}>Help</Heading>
      <p className="mt-2 text-text-muted">Answers to common questions about booking with Urban Air.</p>

      <div className="mt-8 space-y-3">
        <Disclosure title="Is this a real booking?">
          No. This is a prototype. Flights, seats, and confirmation codes are simulated. No payment is processed or stored.
        </Disclosure>
        <Disclosure title="Why do I see the same 40 flights for every search?">
          The prototype offers a fixed set of 40 flights so there is always something to choose from.
        </Disclosure>
        <Disclosure title="How long are my selections kept?">
          Your search, selections, passenger details, and trips stay in this browser for 24 hours. Sample data also refreshes every 24 hours.
        </Disclosure>
        <Disclosure title="I saw a message about a delay or an error. What should I do?">
          Some simulated issues are shown on purpose so you can see how they are handled. Use Try again if the message offers it. Your progress is kept.
        </Disclosure>
        <Disclosure title="Can I book a car or a vacation?">
          Not in this prototype. Those offers appear only as placeholders after a booking.
        </Disclosure>
      </div>

      <p className="mt-10 text-sm text-text-muted">
        Ready to try it? <Link href="/book/search" className="font-semibold text-text-link underline-offset-4 hover:underline">Start a booking</Link>.
      </p>
    </main>
  );
}
