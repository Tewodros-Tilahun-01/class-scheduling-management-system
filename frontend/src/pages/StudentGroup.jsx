"use client";

import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  fetchStudentGroups,
  addStudentGroup,
  updateStudentGroup,
  deleteStudentGroup,
} from "@/services/api";
import DashboardLayout from "@/layouts/DashboardLayout";

export function StudentGroup() {
  const [tableData, setTableData] = React.useState([]);
  const [sorting, setSorting] = React.useState([{ id: "year", desc: false }]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editRowId, setEditRowId] = React.useState(null);
  const [newRow, setNewRow] = React.useState({
    department: "",
    year: "",
    section: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Fetch student groups on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const studentGroups = await fetchStudentGroups();
        setTableData(Array.isArray(studentGroups) ? studentGroups : []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        toast.error(err.response?.data?.error || err.message, {
          description: "Failed to load student groups",
        });
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteRow = async (id) => {
    try {
      await deleteStudentGroup(id);
      setTableData((prev) => prev.filter((row) => row._id !== id));
      toast.success("Student group deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, {
        description: "Failed to delete student group",
      });
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original._id);
    try {
      await Promise.all(selectedIds.map((id) => deleteStudentGroup(id)));
      setTableData((prev) =>
        prev.filter((row) => !selectedIds.includes(row._id))
      );
      setRowSelection({});
      toast.success("Selected student groups deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, {
        description: "Failed to delete selected student groups",
      });
    }
  };

  const handleAddRow = () => {
    setNewRow({ department: "", year: "", section: "" });
    setEditRowId(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditRowId(null);
    setNewRow({ department: "", year: "", section: "" });
  };

  const handleModalSave = async () => {
    if (!newRow.department || !newRow.year || !newRow.section) {
      toast.error("Please fill all fields", {
        description: "All fields are required",
      });
      return;
    }
    try {
      if (editRowId) {
        const updatedGroup = await updateStudentGroup(editRowId, {
          department: newRow.department,
          year: Number(newRow.year),
          section: newRow.section,
        });
        setTableData((prev) =>
          prev.map((row) =>
            row._id === editRowId ? { ...row, ...updatedGroup } : row
          )
        );
        toast.success("Student group updated successfully");
      } else {
        const newGroup = await addStudentGroup({
          department: newRow.department,
          year: Number(newRow.year),
          section: newRow.section,
        });
        setTableData((prev) => [newGroup, ...prev]);
        toast.success("Student group added successfully");
      }
      handleModalClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, {
        description: "Failed to save student group",
      });
    }
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
      accessorKey: "department",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Department
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="p-1">{row.original.department}</div>,
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "year",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="pl-0"
        >
          Year
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="p-1">{row.original.year}</div>,
      sortingFn: "basic", // Numeric sorting for year
    },
    {
      accessorKey: "section",
      header: "Section",
      cell: ({ row }) => <div className="p-1">{row.original.section}</div>,
      enableSorting: false,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original;

        const handleEdit = () => {
          setNewRow({
            department: rowData.department,
            year: rowData.year.toString(),
            section: rowData.section,
          });
          setEditRowId(rowData._id);
          setIsModalOpen(true);
        };

        const handleDelete = () => {
          handleDeleteRow(rowData._id);
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
    <DashboardLayout>
      <div className="w-full p-8">
        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent 
            className="sm:max-w-[425px]"
            onPointerDownOutside={(e) => {
              e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editRowId ? "Edit Student Group" : "Add New Student Group"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="department"
                  className="text-right text-sm font-medium"
                >
                  Department
                </label>
                <Input
                  id="department"
                  value={newRow.department}
                  onChange={(e) =>
                    setNewRow({ ...newRow, department: e.target.value })
                  }
                  placeholder="e.g., Computer Science"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="year"
                  className="text-right text-sm font-medium"
                >
                  Year
                </label>
                <Input
                  id="year"
                  type="number"
                  value={newRow.year}
                  onChange={(e) =>
                    setNewRow({ ...newRow, year: e.target.value })
                  }
                  placeholder="e.g., 1"
                  min="1"
                  max="5"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="section"
                  className="text-right text-sm font-medium"
                >
                  Section
                </label>
                <Input
                  id="section"
                  value={newRow.section}
                  onChange={(e) =>
                    setNewRow({ ...newRow, section: e.target.value })
                  }
                  placeholder="e.g., A"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button onClick={handleModalSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        

        {/* Table Toolbar */}
        <div className="flex items-center py-4 gap-2">
          <Input
            placeholder="Filter by Department..."
            value={table.getColumn("department")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("department")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            disabled={loading}
          />
          <Button variant="outline" onClick={handleAddRow} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student Group
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={loading || table.getFilteredSelectedRowModel().rows.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto" disabled={loading}>
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
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <svg className="animate-spin h-8 w-8 text-gray-500" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                />
              </svg>
            </div>
          ) : (
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
                      No student groups found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
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
              disabled={loading || !table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={loading || !table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
