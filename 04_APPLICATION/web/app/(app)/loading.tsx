import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
    </div>
  );
}
