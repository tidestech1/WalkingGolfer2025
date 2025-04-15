"use client";

import { usePathname } from "next/navigation";

import MiniHeader from "./MiniHeader";
import Navbar from "./Navbar";

export default function NavbarWrapper(): JSX.Element | null {
  const pathname = usePathname();
  const isMapPage = pathname?.startsWith("/map");

  if (isMapPage) {
    return <MiniHeader />;
  }

  return <Navbar />;
}
