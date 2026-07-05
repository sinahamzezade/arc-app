import { useQuery } from "@tanstack/react-query";

async function fetchCoachSession() {
  const res = await fetch("/api/coach-session");
  if (!res.ok) throw new Error("Failed to fetch coach session");
  return res.json();
}

export function useCoachSession() {
  return useQuery({
    queryKey: ["coach-session"],
    queryFn: fetchCoachSession,
  });
}
