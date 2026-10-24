/** Where to go after sign-in. Only same-site paths, so `next` can't send users elsewhere. */
export function safeNext(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return "/";
  return next;
}
