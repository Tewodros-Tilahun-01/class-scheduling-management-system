import React, { useState, useEffect } from "react";
import {
  fetchTimeslots,
  addTimeslot,
  updateTimeslot,
  deleteTimeslot,
} from "../services/api";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Pencil, Trash2 } from "lucide-react";

const TimeslotManager = () => {
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTimeslot, setEditingTimeslot] = useState(null);
  const [formData, setFormData] = useState({
    day: "",
    startTime: "",
    endTime: "",
    preferenceScore: 10,
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    loadTimeslots();
  }, []);

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  };

  const loadTimeslots = async () => {
    try {
      setLoading(true);
      const data = await fetchTimeslots();
      const sortedTimeslots = data.sort((a, b) => {
        const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return formatTime(a.startTime).localeCompare(formatTime(b.startTime));
      });
      setTimeslots(sortedTimeslots);
    } catch (error) {
      toast.error("Failed to load timeslots", {
        description: error.message,
      });
      console.error("Error loading timeslots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.day || !formData.startTime || !formData.endTime) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      });
      return false;
    }

    const [startHours, startMinutes] = formData.startTime.split(":").map(Number);
    const [endHours, endMinutes] = formData.endTime.split(":").map(Number);
    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;

    if (end <= start) {
      toast.error("Validation Error", {
        description: "End time must be after start time",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (editingTimeslot) {
        await updateTimeslot(editingTimeslot._id, formData);
        toast.success("Success", {
          description: "Timeslot updated successfully",
        });
      } else {
        await addTimeslot(formData);
        toast.success("Success", {
          description: "Timeslot added successfully",
        });
      }
      handleCloseDialog();
      loadTimeslots();
    } catch (error) {
      toast.error("Operation Failed", {
        description: error.response?.data?.error || "Failed to save timeslot",
      });
      console.error("Error saving timeslot:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (timeslot) => {
    setEditingTimeslot(timeslot);
    setFormData({
      day: timeslot.day,
      startTime: timeslot.startTime,
      endTime: timeslot.endTime,
      preferenceScore: timeslot.preferenceScore || 10,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    toast.promise(
      async () => {
        setLoading(true);
        await deleteTimeslot(id);
        await loadTimeslots();
        setLoading(false);
      },
      {
        loading: "Deleting timeslot...",
        success: "Timeslot deleted successfully",
        error: "Failed to delete timeslot",
      }
    );
  };

  const handleOpenDialog = () => {
    setEditingTimeslot(null);
    setFormData({
      day: "",
      startTime: "",
      endTime: "",
      preferenceScore: 10,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTimeslot(null);
    setFormData({
      day: "",
      startTime: "",
      endTime: "",
      preferenceScore: 10,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Timeslot Manager</h1>
        <Button onClick={handleOpenDialog} disabled={loading}>
          Add New Timeslot
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Preference Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeslots.map((timeslot) => (
              <TableRow key={timeslot._id}>
                <TableCell>{timeslot.day}</TableCell>
                <TableCell>{formatTime(timeslot.startTime)}</TableCell>
                <TableCell>{formatTime(timeslot.endTime)}</TableCell>
                <TableCell>{timeslot.preferenceScore}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(timeslot)}
                      disabled={loading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(timeslot._id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTimeslot ? "Edit Timeslot" : "Add New Timeslot"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the timeslot. Use 24-hour format.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Day</label>
                <Select
                  value={formData.day}
                  onValueChange={(value) => handleInputChange("day", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time (24h)</label>
                  <Input
                    type="time"
                    value={formatTime(formData.startTime)}
                    onChange={(e) =>
                      handleInputChange("startTime", e.target.value)
                    }
                    required
                    step="1800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time (24h)</label>
                  <Input
                    type="time"
                    value={formatTime(formData.endTime)}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    required
                    step="1800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preference Score</label>
                <Input
                  type="number"
                  value={formData.preferenceScore}
                  onChange={(e) =>
                    handleInputChange("preferenceScore", e.target.value)
                  }
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {editingTimeslot ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeslotManager;
