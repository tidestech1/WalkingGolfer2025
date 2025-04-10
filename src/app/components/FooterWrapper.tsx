"use client";

import { usePathname } from "next/navigation";

import Footer from "./Footer";
import MapFooter from "./MapFooter";

export default function FooterWrapper(): JSX.Element | null {
  const pathname = usePathname();
  const isMapPage = pathname.startsWith("/map");

  if (isMapPage) {
    return <MapFooter />;
  }

  return <Footer />;
}
