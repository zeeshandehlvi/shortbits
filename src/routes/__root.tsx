import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[Root Error]", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ShortBits — Best News Website in America, World, India, Canada & 50 States" },
      {
        name: "description",
        content:
          "ShortBits is the premier global news platform. The best news website in America, India, Canada, and all 50 states, delivering high-impact breaking world news, viral tech, politics, and daily e-papers in 60 seconds.",
      },
      {
        name: "keywords",
        content:
          "best news website in america, best news website in world, best news in usa, best news in india, best news in canada, top news website, breaking news, viral news, tech launches, artificial intelligence, openai news, spacex news, global crisis, war news, geopolitics, california news, texas news, florida news, new york news, pennsylvania news, illinois news, ohio news, georgia news, north carolina news, michigan news, new jersey news, virginia news, washington news, arizona news, massachusetts news, tennessee news, indiana news, missouri news, maryland news, wisconsin news, colorado news, minnesota news, south carolina news, alabama news, louisiana news, kentucky news, oregon news, oklahoma news, connecticut news, utah news, iowa news, nevada news, arkansas news, mississippi news, kansas news, new mexico news, nebraska news, idaho news, west virginia news, hawaii news, new hampshire news, maine news, montana news, rhode island news, delaware news, south dakota news, north dakota news, alaska news, vermont news, wyoming news, ontario news, quebec news, british columbia news, alberta news, toronto news, vancouver news, delhi news, mumbai news, bangalore news, karnataka news, maharashtra news, tamil nadu news, daily epaper, 60 second news",
      },
      { name: "author", content: "ShortBits Global Newsroom" },
      { name: "theme-color", content: "#061838" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      // OpenGraph
      { property: "og:site_name", content: "ShortBits" },
      { property: "og:locale", content: "en_US" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "ShortBits — Best News Website in America, World, India, Canada & 50 States" },
      {
        property: "og:description",
        content:
          "High-impact breaking world news, viral tech launches, geopolitics, and daily e-paper in 60 seconds. Rated the best news platform across America and worldwide.",
      },
      { property: "og:url", content: "https://theshortbits.com" },
      { property: "og:image", content: "https://theshortbits.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@ShortBits" },
      { name: "twitter:creator", content: "@ShortBits" },
      { name: "twitter:title", content: "ShortBits — Best News Website in America, World & 50 States" },
      {
        name: "twitter:description",
        content: "High-impact breaking news and daily digital e-papers in 60 seconds.",
      },
      { name: "twitter:image", content: "https://theshortbits.com/og-image.jpg" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "NewsMediaOrganization",
              "@id": "https://theshortbits.com/#organization",
              "name": "ShortBits",
              "alternateName": ["ShortBits News", "The ShortBits", "ShortBits World News"],
              "url": "https://theshortbits.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://theshortbits.com/icon-512.png",
                "caption": "ShortBits Logo",
              },
              "description":
                "The best news website in America, India, Canada, and worldwide, delivering breaking news in 60 seconds.",
              "sameAs": ["https://twitter.com/ShortBits", "https://www.facebook.com/ShortBits"],
            },
            {
              "@type": "WebSite",
              "@id": "https://theshortbits.com/#website",
              "url": "https://theshortbits.com",
              "name": "ShortBits",
              "description": "The Best News Website in America, World, India, Canada & All 50 States",
              "publisher": { "@id": "https://theshortbits.com/#organization" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://theshortbits.com/?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(function(reg) {
                    console.log('[SW] Registered early in head, scope:', reg.scope);
                  })
                  .catch(function(err) {
                    console.error('[SW] Early registration failed:', err);
                  });
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] ServiceWorker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("[PWA] ServiceWorker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <PWAInstallPrompt />
    </QueryClientProvider>
  );
}
