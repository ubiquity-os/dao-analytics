import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";

export function BreadCrumbs({ steps }: { steps: string[] }) {
  return (
    <Breadcrumb className="text-gray-400">
      <BreadcrumbList>
        {steps.slice(0, -1).map((step, idx) => (
          <>
            <BreadcrumbItem key={idx}>
              <BreadcrumbLink href={`/${step}`}>{step}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{steps[steps.length - 1]}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
