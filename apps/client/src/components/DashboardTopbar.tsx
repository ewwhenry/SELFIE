"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function DashboardTopbar() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="flex flex-row items-center pl-4 h-14">
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const isLast = index === segments.length - 1;

            const label = segment
              .split("-")
              .map((word) => word[0]!.toUpperCase() + word.slice(1))
              .join(" ");

            return [
              <BreadcrumbItem key={href}>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>,

              !isLast && (
                <BreadcrumbSeparator key={href + "separator"}>
                  /
                </BreadcrumbSeparator>
              ),
            ];
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
