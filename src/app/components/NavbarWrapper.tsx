"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";

export default function NavbarWrapper(): JSX.Element | null {
  const pathname = usePathname();
  const isMapPage = pathname?.startsWith("/map");

  if (isMapPage) {
    return null;
  }

  return <Navbar />;
}
