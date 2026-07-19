/** React Query key for GET /lessons/:id/play — always keyed on user id, never token. */
export function playQueryKey(lessonId: string, userId: string | null | undefined) {
  return ["lessons", "play", lessonId, userId ?? "anon"] as const;
}
