import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import {
  fetchSemesters,
  deleteSchedule,
  exportRoomReport,
} from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  BookOpen,
  RefreshCw,
  DoorOpen,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SemesterList = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const semestersData = await fetchSemesters();
        if (Array.isArray(semestersData) && semestersData.length > 0) {
          setSemesters(semestersData);
          toast.success("Semesters loaded successfully", {
            description: `${semestersData.length} semester(s) fetched`,
          });
        } else {
          setSemesters([]);
          toast.error("No semesters found", {
            description: "No semesters available",
          });
        }
      } catch (err) {
        setError(
          `Error fetching semesters: ${
            err.response?.data?.error || err.message
          }`
        );
        toast.error(err.response?.data?.error || "Failed to load semesters", {
          description: "Unable to fetch semesters from the server",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteSchedule = async (semester) => {
    try {
      setDeleteLoading(true);
      await deleteSchedule(semester);
      // Refresh the semesters list
      const updatedSemesters = semesters.filter((sem) => sem !== semester);
      setSemesters(updatedSemesters);
      toast.success("Schedule deleted successfully", {
        description: `Schedule for ${semester} has been deleted`,
      });
      setDialogOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete schedule", {
        description: "Unable to delete the schedule",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportRoomReport = async (semester) => {
    try {
      setExportLoading(true);
      const blob = await exportRoomReport(semester);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Room_Report_${semester.replace(/\s/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Room report exported successfully", {
        description: `Report for ${semester} has been downloaded`,
      });
    } catch (err) {
      toast.error(err.message || "Failed to export room report", {
        description: "Unable to generate the room report",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="container px-8">
      <Card>
        <CardHeader>
          <CardTitle>Available Semesters</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
          ) : semesters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester) => (
                  <TableRow key={semester}>
                    <TableCell className="font-medium">{semester}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 justify-end">
                        <Button
                          asChild
                          variant="green-link"
                          size="sm"
                          className="group"
                        >
                          <Link
                            to={`/schedules/${encodeURIComponent(semester)}`}
                          >
                            <Users className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            Student Groups
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="green-link"
                          size="sm"
                          className="group"
                        >
                          <Link
                            to={`/schedules/${encodeURIComponent(
                              semester
                            )}/lectures`}
                          >
                            <BookOpen className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            Lectures
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="green-link"
                          size="sm"
                          className="group"
                        >
                          <Link
                            to={`/schedules/${encodeURIComponent(
                              semester
                            )}/regenerateSchedule`}
                          >
                            <RefreshCw className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            Reschedule
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="green-link"
                          size="sm"
                          className="group"
                        >
                          <Link
                            to={`/schedules/${encodeURIComponent(
                              semester
                            )}/free-rooms`}
                          >
                            <DoorOpen className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            Free Rooms
                          </Link>
                        </Button>
                        <Button
                          variant="green-link"
                          size="sm"
                          className="group"
                          onClick={() => handleExportRoomReport(semester)}
                          disabled={exportLoading}
                        >
                          {exportLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                          )}
                          Room Report
                        </Button>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSelectedSemester(semester)}
                              className="group"
                            >
                              <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Schedule</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete the schedule for{" "}
                                {selectedSemester}? This action cannot be
                                undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                disabled={deleteLoading}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteSchedule(selectedSemester)
                                }
                                disabled={deleteLoading}
                              >
                                {deleteLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No semesters available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SemesterList;
