import { ButtonLink } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <Heading level={1} size={2} brand>We could not find that page</Heading>
      <p className="text-text-muted">The link may be out of date. You can start a new search from the home page.</p>
      <ButtonLink href="/">Back to home</ButtonLink>
    </main>
  );
}
