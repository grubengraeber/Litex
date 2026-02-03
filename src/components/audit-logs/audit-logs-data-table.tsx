"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";
import { AuditLog } from "./columns";

interface AuditLogsDataTableProps {
  columns: ColumnDef<AuditLog>[];
  data: AuditLog[];
  onExport?: () => void;
}

export function AuditLogsDataTable({
  columns,
  data,
  onExport,
}: AuditLogsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} onExport={onExport} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="bg-slate-50 p-4">
                        <ExpandedRowContent log={row.original} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Keine Audit Logs gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500">
          {table.getFilteredRowModel().rows.length} Einträge
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück
          </Button>
          <div className="text-sm text-slate-500">
            Seite {table.getState().pagination.pageIndex + 1} von{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Weiter
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExpandedRowContent({ log }: { log: AuditLog }) {
  const metadata = log.metadata ? JSON.parse(log.metadata) : null;
  const changes = log.changes ? JSON.parse(log.changes) : null;

  return (
    <div className="space-y-4 text-sm">
      {log.errorMessage && (
        <div>
          <div className="font-semibold text-red-600 mb-1">Fehlermeldung:</div>
          <div className="text-red-700 bg-red-50 p-3 rounded border border-red-200">
            {log.errorMessage}
          </div>
        </div>
      )}

      {log.userAgent && (
        <div>
          <div className="font-semibold text-slate-700 mb-1">User Agent:</div>
          <div className="text-slate-600 bg-white p-3 rounded border">
            {log.userAgent}
          </div>
        </div>
      )}

      {metadata && (
        <div>
          <div className="font-semibold text-slate-700 mb-1">Metadata:</div>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}

      {changes && (
        <div>
          <div className="font-semibold text-slate-700 mb-1">Änderungen:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {changes.before && (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Vorher:
                </div>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(changes.before, null, 2)}
                </pre>
              </div>
            )}
            {changes.after && (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Nachher:
                </div>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(changes.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
