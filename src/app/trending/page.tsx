import { redirect } from "next/navigation";

// Trending is now the landing page at "/". Keep this route as a permanent
// redirect so existing links/bookmarks to /trending still work.
export default function TrendingRedirect() {
  redirect("/");
}
