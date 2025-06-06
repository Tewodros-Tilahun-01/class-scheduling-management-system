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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  fetchRooms,
  fetchRoomTypes,
  addRoom,
  updateRoom,
  deleteRoom,
  fetchBuildings,
} from "@/services/api";
import BuildingManager from "@/components/BuildingManager";

export default function Room() {
  const [tableData, setTableData] = React.useState([]);
  const [roomTypes, setRoomTypes] = React.useState([]);
  const [buildings, setBuildings] = React.useState([]);
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
    capacity: "",
    type: "",
    building: "",
    active: true,
  });
  const [formErrors, setFormErrors] = React.useState({});

  // Fetch rooms, room types, and buildings on mount
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [rooms, types, buildingsData] = await Promise.all([
          fetchRooms(),
          fetchRoomTypes(),
          fetchBuildings(),
        ]);
        setTableData(rooms);
        setRoomTypes(types);
        setBuildings(buildingsData);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to load data", {
          description: "Unable to fetch data from the server",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!newRow.name.trim()) errors.name = "Room name is required";
    if (!newRow.capacity) {
      errors.capacity = "Capacity is required";
    } else if (isNaN(newRow.capacity) || newRow.capacity < 1) {
      errors.capacity = "Capacity must be a positive number";
    }
    if (!newRow.type) errors.type = "Room type is required";
    if (!newRow.building) errors.building = "Building is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fill all required fields", {
        description:
          "Room name, capacity, room type, and building are required",
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
      await deleteRoom(deleteRowId);
      setTableData((prev) => prev.filter((row) => row._id !== deleteRowId));
      setIsDeleteConfirmOpen(false);
      setDeleteRowId(null);
      toast.success("Room deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete room", {
        description: "Unable to delete the room",
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
      await Promise.all(selectedIds.map((id) => deleteRoom(id)));
      setTableData((prev) =>
        prev.filter((row) => !selectedIds.includes(row._id))
      );
      setRowSelection({});
      toast.success("Selected rooms deleted successfully");
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to delete selected rooms",
        {
          description: "Unable to delete the selected rooms",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    setNewRow({ name: "", capacity: "", type: "", building: "", active: true });
    setEditRowId(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditRowId(null);
    setNewRow({ name: "", capacity: "", type: "", building: "", active: true });
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
      // Find the building name from the selected building ID
      const selectedBuilding = buildings.find((b) => b._id === newRow.building);
      if (!selectedBuilding) {
        toast.error("Selected building not found");
        return;
      }

      const roomData = {
        ...newRow,
        capacity: Number(newRow.capacity),
        building: selectedBuilding.name, // Use building name instead of ID
      };

      if (editRowId) {
        const updatedRoom = await updateRoom(editRowId, roomData);
        setTableData((prev) =>
          prev.map((row) =>
            row._id === editRowId ? { ...row, ...updatedRoom } : row
          )
        );
        toast.success("Room updated successfully");
      } else {
        const newRoom = await addRoom(roomData);
        setTableData((prev) => [newRoom, ...prev]);
        toast.success("Room added successfully");
      }
      handleModalClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save room", {
        description: "Unable to save the room",
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
          Room Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="p-1">{row.original.name}</div>,
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          disabled={isLoading}
          className="pl-0"
        >
          Capacity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="p-1">{row.original.capacity}</div>,
      sortingFn: "basic",
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          disabled={isLoading}
          className="pl-0"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="p-1 capitalize">{row.original.type}</div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "building",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          disabled={isLoading}
          className="pl-0"
        >
          Building
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="p-1">{row.original.building}</div>,
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          disabled={isLoading}
          className="pl-0"
        >
          Active
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="p-1">
          <span
            className={
              row.original.active
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {row.original.active ? "Yes" : "No"}
          </span>
        </div>
      ),
      sortingFn: "basic",
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const rowData = row.original;

        const handleEdit = () => {
          setNewRow({
            name: rowData.name,
            capacity: String(rowData.capacity),
            type: rowData.type,
            building: rowData.building,
            active: rowData.active,
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
    <DashboardLayout>
      <div className="w-full p-8">
        <div className="flex gap-6">
          {/* Main Room Management Section */}
          <div className="flex-1">
            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onClose={handleModalClose}>
              <div className="fixed inset-0 bg-black/30" />
              <div className="fixed inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md space-y-6 shadow-lg">
                  <h3 className="text-lg font-medium">
                    {editRowId ? "Edit Room" : "Add New Room"}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="name" className="text-sm font-medium">
                        Room Name
                      </label>
                      <Input
                        id="name"
                        value={newRow.name}
                        onChange={(e) =>
                          setNewRow({ ...newRow, name: e.target.value })
                        }
                        placeholder="Room Name"
                        className={formErrors.name ? "border-red-500" : ""}
                        disabled={isSubmitting}
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm">
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="capacity" className="text-sm font-medium">
                        Capacity
                      </label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newRow.capacity}
                        onChange={(e) =>
                          setNewRow({ ...newRow, capacity: e.target.value })
                        }
                        placeholder="Capacity"
                        className={formErrors.capacity ? "border-red-500" : ""}
                        disabled={isSubmitting}
                      />
                      {formErrors.capacity && (
                        <p className="text-red-500 text-sm">
                          {formErrors.capacity}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="type" className="text-sm font-medium">
                        Room Type
                      </label>
                      <Select
                        value={newRow.type}
                        onValueChange={(value) =>
                          setNewRow({ ...newRow, type: value })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          className={formErrors.type ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.type && (
                        <p className="text-red-500 text-sm">
                          {formErrors.type}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="building" className="text-sm font-medium">
                        Building
                      </label>
                      <Select
                        value={newRow.building}
                        onValueChange={(value) =>
                          setNewRow({ ...newRow, building: value })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          className={
                            formErrors.building ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Select building" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem key={building._id} value={building._id}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.building && (
                        <p className="text-red-500 text-sm">
                          {formErrors.building}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 flex align-baseline">
                      <label
                        htmlFor="active"
                        className="text-sm font-medium mr-3 ml-1"
                      >
                        Active
                      </label>
                      <Checkbox
                        id="active"
                        checked={newRow.active}
                        onCheckedChange={(checked) =>
                          setNewRow({ ...newRow, active: checked })
                        }
                        disabled={isSubmitting}
                      />
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
                    Are you sure you want to delete this room? This action
                    cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDeleteModalClose}
                      disabled={isLoading}
                    >
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
                placeholder="Filter by Room name..."
                value={table.getColumn("name")?.getFilterValue() ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                onClick={handleAddRow}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={
                  isLoading ||
                  table.getFilteredSelectedRowModel().rows.length === 0
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="ml-auto"
                    disabled={isLoading}
                  >
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
                          No rooms found.
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
                {table.getFilteredRowModel().rows.length} room(s) selected.
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

          {/* Building Manager Sidebar */}
          <BuildingManager />
        </div>
      </div>
    </DashboardLayout>
  );
}
