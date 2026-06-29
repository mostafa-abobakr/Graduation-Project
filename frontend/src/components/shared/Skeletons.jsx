import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

export function SkeletonRows({ rows = 5, cols = 7 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={i} className="border-border/50">
      <TableCell className="text-center">
        <Skeleton className="h-4 w-4 mx-auto" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-5 w-20 rounded-full mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-12 mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-14 mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-5 w-12 rounded-full mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-8 w-8 mx-auto rounded" />
      </TableCell>
    </TableRow>
  ));
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-5 py-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-[400px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[340px] rounded-xl" />
      <Skeleton className="h-[360px] rounded-xl" />
    </div>
  );
}
