import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@headlessui/react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  fetchBuildings,
  addBuilding,
  updateBuilding,
  deleteBuilding,
} from "@/services/api";

const BuildingManager = () => {
  const [buildings, setBuildings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [newBuilding, setNewBuilding] = useState({ name: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      const data = await fetchBuildings();
      setBuildings(data);
    } catch (error) {
      toast.error("Failed to load buildings", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBuilding = () => {
    setNewBuilding({ name: "" });
    setSelectedBuilding(null);
    setIsModalOpen(true);
  };

  const handleEditBuilding = (building) => {
    setNewBuilding({ name: building.name });
    setSelectedBuilding(building);
    setIsModalOpen(true);
  };

  const handleDeleteBuilding = (building) => {
    setSelectedBuilding(building);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBuilding(null);
    setNewBuilding({ name: "" });
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedBuilding(null);
  };

  const handleSave = async () => {
    if (!newBuilding.name.trim()) {
      toast.error("Building name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedBuilding) {
        await updateBuilding(selectedBuilding._id, newBuilding);
        toast.success("Building updated successfully");
      } else {
        await addBuilding(newBuilding);
        toast.success("Building added successfully");
      }
      handleModalClose();
      loadBuildings();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to save building";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBuilding) return;

    setIsSubmitting(true);
    try {
      await deleteBuilding(selectedBuilding._id);
      toast.success("Building and associated rooms deleted successfully");
      handleDeleteModalClose();
      loadBuildings();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete building";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-80 bg-card rounded-lg shadow-sm border border-border/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Buildings</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddBuilding}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Building
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <svg
              className="animate-spin h-6 w-6 text-gray-500"
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
          buildings.map((building) => (
            <div
              key={building._id}
              className="flex items-center justify-between p-2 bg-background rounded-md"
            >
              <span className="text-sm">{building.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditBuilding(building)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBuilding(building)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleModalClose}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-sm space-y-4 shadow-lg">
            <h3 className="text-lg font-medium">
              {selectedBuilding ? "Edit Building" : "Add New Building"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">
                  Building Name
                </label>
                <Input
                  id="name"
                  value={newBuilding.name}
                  onChange={(e) =>
                    setNewBuilding({ ...newBuilding, name: e.target.value })
                  }
                  placeholder="Building Name"
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
              <Button onClick={handleSave} disabled={isSubmitting}>
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
      <Dialog open={isDeleteModalOpen} onClose={handleDeleteModalClose}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-sm space-y-4 shadow-lg">
            <h3 className="text-lg font-medium">Confirm Delete</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this building? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleDeleteModalClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
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
    </div>
  );
};

export default BuildingManager;
