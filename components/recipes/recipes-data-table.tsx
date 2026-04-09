"use client";

import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleFavorite } from "@/app/actions/recipes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RecipesDataTable({ data }: { data: Recipe[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const columns = useMemo<ColumnDef<Recipe>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Recipe",
        cell: ({ row }) => (
          <Link
            href={`/recipes/${row.original.id}`}
            className="text-primary font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "meal_types",
        header: "Meals",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.meal_types.map((m) => (
              <Badge key={m} variant="secondary" className="text-[10px]">
                {m}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "nutrition",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Protein
            <ArrowUpDown className="ml-1 size-3 opacity-50" aria-hidden />
          </Button>
        ),
        sortingFn: (a, b) =>
          (a.original.nutrition?.protein ?? 0) -
          (b.original.nutrition?.protein ?? 0),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.nutrition
              ? `${row.original.nutrition.protein} g`
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "cook_count",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cooked
            <ArrowUpDown className="ml-1 size-3 opacity-50" aria-hidden />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.cook_count}</span>
        ),
      },
      {
        id: "favorite",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-primary"
            aria-label="Toggle favorite"
            onClick={async () => {
              try {
                await toggleFavorite(row.original.id, !row.original.favorite);
                toast.success("Updated");
                router.refresh();
              } catch {
                toast.error("Failed");
              }
            }}
          >
            <Heart
              className={cn(
                "size-4",
                row.original.favorite && "fill-primary text-primary"
              )}
            />
          </Button>
        ),
      },
    ],
    [router]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No recipes.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
