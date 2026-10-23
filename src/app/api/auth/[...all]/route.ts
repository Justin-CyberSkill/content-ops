import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/shared/auth/index.server";

export const { GET, POST } = toNextJsHandler(auth);
