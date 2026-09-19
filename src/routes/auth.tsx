import { createFileRoute } from "@tanstack/react-router";
import AccountPage from "./account";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ShortBits — Sign In & Account" },
      { name: "description", content: "Sign in to ShortBits to access bookmarks, newsroom publishing tools, and account preferences." },
      { property: "og:title", content: "ShortBits — Sign In & Account" },
      { property: "og:description", content: "Sign in to ShortBits newsroom and reader account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});
