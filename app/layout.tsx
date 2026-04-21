import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Farmmap — UK & Ireland Farm Shop Directory",
    template: "%s — Farmmap",
  },
  description: "Find farm shops across the UK and Ireland on an interactive map. Fresh produce, dairy, meat, eggs, bakery and more — direct from the farm.",
  keywords: ["farm shop", "farm shops UK", "farm shops Ireland", "local produce", "buy direct from farm", "farmgate", "pick your own"],
  authors: [{ name: "Derrywilligan Farm Ltd", url: SITE_URL }],
  creator: "Derrywilligan Farm Ltd",
  publisher: "Farmmap",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "Farmmap — UK & Ireland Farm Shop Directory",
    description: "Interactive map directory of farm shops across the UK and Ireland. Find fresh produce direct from the farm.",
    url: SITE_URL,
    siteName: "Farmmap",
    locale: "en_GB",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Farmmap — UK & Ireland Farm Shop Directory" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farmmap — UK & Ireland Farm Shop Directory",
    description: "Find farm shops across the UK and Ireland on an interactive map.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Farmmap',
  url: SITE_URL,
  description: 'Interactive map directory of farm shops across the UK and Ireland',
  publisher: {
    '@type': 'Organization',
    name: 'Derrywilligan Farm Ltd',
    legalName: 'Derrywilligan Farm Ltd',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '167 Armagh Road',
      addressLocality: 'Newry',
      addressRegion: 'Northern Ireland',
      postalCode: 'BT35 6PX',
      addressCountry: 'GB',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@farmmap.co.uk',
      contactType: 'customer service',
    },
    sameAs: [],
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${poppins.variable} ${openSans.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
