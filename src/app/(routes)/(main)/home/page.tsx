/**
 * Route registration only — UI kept alive by `MainTabShell`.
 * Avoids server prefetch + `loading.tsx` flash on every tab press.
 */
export default function HomePage() {
  return null;
}
