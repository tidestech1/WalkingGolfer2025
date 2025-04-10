"use client";

import { usePathname } from "next/navigation";

import Footer from "./Footer";

export default function FooterWrapper(): JSX.Element | null {
  const pathname = usePathname();
  const isMapPage = pathname.startsWith("/map");

  if (isMapPage) {
    return null;
  }

  return <Footer />;
}
