import { apiGet } from "@/lib/api/server";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "Trips and profile" };

type Tier = { code: string; name: string; min_points: number; benefits: string };

export default async function ProfilePage() {
  const data = await apiGet<{ tiers: Tier[] }>("/rewards/tiers");
  return <ProfileClient tiers={data?.tiers ?? []} />;
}
