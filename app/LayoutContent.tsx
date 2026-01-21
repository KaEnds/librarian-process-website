'use client';

import { usePathname } from "next/navigation";
import Sidemenu from "@/components/Sidemenu";
import Topmenu from "@/components/Topmenu";

export default function LayoutContent({
  children,
  montserratVar,
  ibmPlexVar,
}: {
  children: React.ReactNode;
  montserratVar: string;
  ibmPlexVar: string;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <body className={`${montserratVar} ${ibmPlexVar} antialiased`}>
      {isAuthPage ? (
        <>{children}</>
      ) : (
        <div className="flex h-screen">
          <Sidemenu />
          <div className="flex-1 flex flex-col relative">
            <Topmenu />
            <main className="flex-1 overflow-auto mt-20">
              {children}
            </main>
          </div>
        </div>
      )}
    </body>
  );
}
