import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
