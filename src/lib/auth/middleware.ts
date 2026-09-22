import { createMiddleware } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase-server";

export const authMiddleware = createMiddleware({ type: "function" })
  .server(async ({ next }) => {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw new Error("Unauthorized");
    }
    return next({ context: { userId: data.user.id } });
  });
