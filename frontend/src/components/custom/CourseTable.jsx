"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialData = [
  {
    id: "m5gr84i9",
    course: "Software Engineering",
    longname: "Introduction to Programming",
    coursecode: "SE101",
  },
  {
    id: "a1b2c3d4",
    course: "Computer Science",
    longname: "Data Structures and Algorithms",
    coursecode: "CS201",
  },
  {
    id: "x9y8z7w6",
    course: "Information Systems",
    longname: "Database Management Systems",
    coursecode: "IS202",
  },
  {
    id: "t5u4v3s2",
    course: "Software Engineering",
    longname: "Software Project Management",
    coursecode: "SE305",
  },
  {
    id: "l3k2j1h0",
    course: "Computer Science",
    longname: "Operating Systems",
    coursecode: "CS301",
  },
  {
    id: "q8w7e6r5",
    course: "Information Systems",
    longname: "System Analysis and Design",
    coursecode: "IS204",
  },
  {
    id: "z1x2c3v4",
    course: "Computer Science",
    longname: "Computer Networks",
    coursecode: "CS303",
  },
  {
    id: "b6n5m4l3",
    course: "Software Engineering",
    longname: "Software Quality Assurance",
    coursecode: "SE402",
  },
  {
    id: "j2k3l4m5",
    course: "Information Systems",
    longname: "Enterprise Architecture",
    coursecode: "IS305",
  },
  {
    id: "n7m8b9v0",
    course: "Computer Science",
    longname: "Artificial Intelligence",
    coursecode: "CS404",
  },
  {
    id: "c1d2e3f4",
    course: "Software Engineering",
    longname: "Agile Development",
    coursecode: "SE303",
  },
  {
    id: "r5t6y7u8",
    course: "Information Systems",
    longname: "Information Security",
    coursecode: "IS306",
  },
  {
    id: "v4b3n2m1",
    course: "Computer Science",
    longname: "Machine Learning",
    coursecode: "CS405",
  },
  {
    id: "g6h7j8k9",
    course: "Software Engineering",
    longname: "Software Architecture",
    coursecode: "SE401",
  },
  {
    id: "y6u5i4o3",
    course: "Computer Science",
    longname: "Theory of Computation",
    coursecode: "CS307",
  },
  {
    id: "p9o8i7u6",
    course: "Information Systems",
    longname: "Business Intelligence",
    coursecode: "IS401",
  },
  {
    id: "w1e2r3t4",
    course: "Software Engineering",
    longname: "Human-Computer Interaction",
    coursecode: "SE202",
  },
  {
    id: "a3s4d5f6",
    course: "Computer Science",
    longname: "Compiler Design",
    coursecode: "CS402",
  },
  {
    id: "z9x8c7v6",
    course: "Information Systems",
    longname: "IT Project Management",
    coursecode: "IS307",
  },
  {
    id: "u7i8o9p0",
    course: "Software Engineering",
    longname: "Requirements Engineering",
    coursecode: "SE201",
  },
];

export function CourseTable() {
  const [tableData, setTableData] = React.useState(initialData);
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editRowId, setEditRowId] = React.useState(null);
  const [newRow, setNewRow] = React.useState({
    course: "",
    longname: "",
    coursecode: "",
  });

  const handleDeleteRow = (id) => {
    setTableData((prev) => prev.filter((row) => row.id !== id));
  };

  const handleBulkDelete = () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    setTableData((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
    setRowSelection({});
  };

  const handleAddRow = () => {
    setNewRow({ course: "", longname: "", coursecode: "" });
    setEditRowId(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditRowId(null);
    setNewRow({ course: "", longname: "", coursecode: "" });
  };

  const handleModalSave = () => {
    if (editRowId) {
      setTableData((prev) =>
        prev.map((row) =>
          row.id === editRowId ? { ...row, ...newRow, id: editRowId } : row
        )
      );
    } else {
      const newRowWithId = { ...newRow, id: crypto.randomUUID() };
      setTableData((prev) => [newRowWithId, ...prev]);
    }
    handleModalClose();
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "course",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Course
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="p-1">{row.original.course}</div>,
      sortingFn: "alphanumeric", // This ensures sorting is handled correctly for strings
    },
    {
      accessorKey: "longname",
      header: "Long Name",
      cell: ({ row }) => <div className="p-1">{row.original.longname}</div>,
    },
    {
      accessorKey: "coursecode",
      header: "Course Code",
      cell: ({ row }) => (
        <div className="p-1 uppercase">{row.original.coursecode}</div>
      ),
      enableSorting: false, // Disable sorting for coursecode column
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original;

        const handleEdit = () => {
          setNewRow({
            course: rowData.course,
            longname: rowData.longname,
            coursecode: rowData.coursecode,
          });
          setEditRowId(rowData.id);
          setIsModalOpen(true);
        };

        const handleDelete = () => {
          handleDeleteRow(rowData.id);
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      {/* Modal */}
      <Dialog open={isModalOpen} onClose={handleModalClose}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md space-y-6 shadow-lg">
            <h3 className="text-lg font-medium">
              {editRowId ? "Edit Course" : "Add New Course"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="course" className="text-sm font-medium">
                  Course
                </label>
                <Input
                  id="course"
                  value={newRow.course}
                  onChange={(e) =>
                    setNewRow({ ...newRow, course: e.target.value })
                  }
                  placeholder="Course Name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="longname" className="text-sm font-medium">
                  Long Name
                </label>
                <Input
                  id="longname"
                  value={newRow.longname}
                  onChange={(e) =>
                    setNewRow({ ...newRow, longname: e.target.value })
                  }
                  placeholder="Long Course Name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="coursecode" className="text-sm font-medium">
                  Course Code
                </label>
                <Input
                  id="coursecode"
                  value={newRow.coursecode}
                  onChange={(e) =>
                    setNewRow({ ...newRow, coursecode: e.target.value })
                  }
                  placeholder="Course Code"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button onClick={handleModalSave}>Save</Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Table Toolbar */}
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by Course name..."
          value={table.getColumn("course")?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn("course")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleAddRow}>
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
        <Button
          variant="destructive"
          onClick={handleBulkDelete}
          disabled={table.getFilteredSelectedRowModel().rows.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <MoreHorizontal className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
