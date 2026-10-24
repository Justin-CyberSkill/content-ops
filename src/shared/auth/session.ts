import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth-server";

/** The signed-in user's session, or null. Call inside a `<Suspense>` boundary. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** The signed-in user. Redirects to the sign-in page when there is none. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

/** The signed-in admin. Sends members back to the home page. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
