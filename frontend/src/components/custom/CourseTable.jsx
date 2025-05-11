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
import { toast } from "@/components/ui/sonner";
import {
  fetchCourses,
  addCourse,
  updateCourse,
  deleteCourse,
} from "@/services/api";

export function CourseTable() {
  const [tableData, setTableData] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [deleteRowId, setDeleteRowId] = React.useState(null);
  const [editRowId, setEditRowId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newRow, setNewRow] = React.useState({
    name: "",
    longName: "",
    courseCode: "",
  });
  const [formErrors, setFormErrors] = React.useState({});

  // Fetch courses on mount
  React.useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      try {
        const courses = await fetchCourses();
        setTableData(courses);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to load courses", {
          description: "Unable to fetch courses from the server",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!newRow.name.trim()) errors.name = "Course name is required";
    if (!newRow.longName.trim()) errors.longName = "Long name is required";
    if (!newRow.courseCode.trim()) {
      errors.courseCode = "Course code is required";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fill all required fields", {
        description: "Course name, long name, and course code are required",
      });
    }
    return Object.keys(errors).length === 0;
  };

  const handleDeleteRow = async (id) => {
    setDeleteRowId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      await deleteCourse(deleteRowId);
      setTableData((prev) => prev.filter((row) => row._id !== deleteRowId));
      setIsDeleteConfirmOpen(false);
      setDeleteRowId(null);
      toast.success("Course deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete course", {
        description: "Unable to delete the course",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original._id);
    try {
      await Promise.all(selectedIds.map((id) => deleteCourse(id)));
      setTableData((prev) =>
        prev.filter((row) => !selectedIds.includes(row._id))
      );
      setRowSelection({});
      toast.success("Selected courses deleted successfully");
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to delete selected courses",
        {
          description: "Unable to delete the selected courses",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    setNewRow({ name: "", longName: "", courseCode: "" });
    setEditRowId(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditRowId(null);
    setNewRow({ name: "", longName: "", courseCode: "" });
    setFormErrors({});
  };

  const handleDeleteModalClose = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteRowId(null);
  };

  const handleModalSave = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editRowId) {
        const updatedCourse = await updateCourse(editRowId, newRow);
        setTableData((prev) =>
          prev.map((row) =>
            row._id === editRowId ? { ...row, ...updatedCourse } : row
          )
        );
        toast.success("Course updated successfully");
      } else {
        const newCourse = await addCourse(newRow);
        setTableData((prev) => [newCourse, ...prev]);
        toast.success("Course added successfully");
      }
      handleModalClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save course", {
        description: "Unable to save the course",
      });
    } finally {
      setIsSubmitting(false);
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
          disabled={isLoading}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          disabled={isLoading}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          disabled={isLoading}
          className="pl-0"
        >
          Course Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="p-1">{row.original.name}</div>,
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "longName",
      header: "Long Name",
      cell: ({ row }) => <div className="p-1">{row.original.longName}</div>,
    },
    {
      accessorKey: "courseCode",
      header: "Course Code",
      cell: ({ row }) => (
        <div className="p-1 uppercase">{row.original.courseCode}</div>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original;

        const handleEdit = () => {
          setNewRow({
            name: rowData.name,
            longName: rowData.longName,
            courseCode: rowData.courseCode,
          });
          setEditRowId(rowData._id);
          setIsModalOpen(true);
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteRow(rowData._id)}>
                Remove
              </DropdownMenuItem>
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
      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleModalClose}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md space-y-6 shadow-lg">
            <h3 className="text-lg font-medium">
              {editRowId ? "Edit Course" : "Add New Course"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">
                  Course Name
                </label>
                <Input
                  id="name"
                  value={newRow.name}
                  onChange={(e) =>
                    setNewRow({ ...newRow, name: e.target.value })
                  }
                  placeholder="Course Name"
                  className={formErrors.name ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="longName" className="text-sm font-medium">
                  Long Name
                </label>
                <Input
                  id="longName"
                  value={newRow.longName}
                  onChange={(e) =>
                    setNewRow({ ...newRow, longName: e.target.value })
                  }
                  placeholder="Long Course Name"
                  className={formErrors.longName ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {formErrors.longName && (
                  <p className="text-red-500 text-sm">{formErrors.longName}</p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="courseCode" className="text-sm font-medium">
                  Course Code
                </label>
                <Input
                  id="courseCode"
                  value={newRow.courseCode}
                  onChange={(e) =>
                    setNewRow({ ...newRow, courseCode: e.target.value })
                  }
                  placeholder="e.g., CS101"
                  className={formErrors.courseCode ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {formErrors.courseCode && (
                  <p className="text-red-500 text-sm">
                    {formErrors.courseCode}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleModalClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleModalSave} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
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
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onClose={handleDeleteModalClose}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md space-y-6 shadow-lg">
            <h3 className="text-lg font-medium">Confirm Delete</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDeleteModalClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
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
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Table Toolbar */}
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by Course name..."
          value={table.getColumn("name")?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
          disabled={isLoading}
        />
        <Button variant="outline" onClick={handleAddRow} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
        <Button
          variant="destructive"
          onClick={handleBulkDelete}
          disabled={
            isLoading || table.getFilteredSelectedRowModel().rows.length === 0
          }
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto" disabled={isLoading}>
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

      {/* Table or Loading Spinner */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <svg
              className="animate-spin h-8 w-8 text-gray-500"
              viewBox="0 0 24 24"
            >
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
                    No courses found.
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
          {table.getFilteredRowModel().rows.length} course(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={isLoading || !table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={isLoading || !table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
