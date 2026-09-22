import { createServerClient } from "@supabase/ssr";
import { getRequest } from "@tanstack/react-start/server";

export function getSupabaseServerClient() {
  const request = getRequest();
  if (!request) throw new Error("getSupabaseServerClient called outside request");

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const header = request.headers.get("cookie") ?? "";
          return header
            .split(";")
            .filter(Boolean)
            .map((pair) => {
              const [name, ...rest] = pair.trim().split("=");
              return { name, value: rest.join("=") };
            });
        },
        setAll() {
          // Cookies are set via setCookie in middleware/handler responses
        },
      },
    },
  );
}
