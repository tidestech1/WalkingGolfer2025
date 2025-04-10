"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import MiniHeader from "./MiniHeader";

export default function NavbarWrapper(): JSX.Element | null {
  const pathname = usePathname();
  const isMapPage = pathname?.startsWith("/map");

  if (isMapPage) {
    return <MiniHeader />;
  }

  return <Navbar />;
}
