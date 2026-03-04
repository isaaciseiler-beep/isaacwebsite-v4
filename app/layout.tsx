import type { Metadata } from "next";
import "@/styles/globals.scss";
import Cursor from "@/components/Cursor";
import BootLoader from "@/components/BootLoader";
import MiniRouteLoader from "@/components/MiniRouteLoader";
import OmniSearch from "@/components/OmniSearch";

export const metadata: Metadata = {
  title: "Isaac Seiler",
  description:
    "Isaac Seiler is a recent graduate of Washington University in St. Louis, Fulbright Scholar, and Truman Scholar."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BootLoader>
          <MiniRouteLoader />
          <Cursor />
          <OmniSearch />
          {children}
        </BootLoader>
      </body>
    </html>
  );
}
