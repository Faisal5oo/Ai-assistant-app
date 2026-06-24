// Middleware handles all root-path routing:
//   - Unauthenticated → /auth
//   - Authenticated    → /dashboard
// This component is only reached if middleware passes through (it never will
// for the root path), so render nothing as a safe fallback.
export default function Home() {
  return null;
}
