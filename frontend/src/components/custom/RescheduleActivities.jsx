import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchScheduledActivities, regenerateSchedule } from "@/services/api";
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
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  ArrowUpDown,
  Search,
  Calendar,
  BookOpen,
  Users,
  Home,
  Clock,
  Split,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/layouts/DashboardLayout";

const RescheduleActivities = () => {
  const navigate = useNavigate();
  const { semesterid } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await fetchScheduledActivities(semesterid);
        setActivities(data);
      } catch (err) {
        toast.error(err.message || "Failed to fetch activities");
      } finally {
        setLoading(false);
      }
    };

    if (semesterid) {
      fetchActivities();
    }
  }, [semesterid]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortedActivities = () => {
    if (!sortConfig.key) return activities;

    return [...activities].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "course":
          aValue = a.course?.courseCode || "";
          bValue = b.course?.courseCode || "";
          break;
        case "lecture":
          aValue = a.lecture?.name || "";
          bValue = b.lecture?.name || "";
          break;
        case "studentGroup":
          aValue = `${a.studentGroup?.department} Year ${a.studentGroup?.year} Section ${a.studentGroup?.section}`;
          bValue = `${b.studentGroup?.department} Year ${b.studentGroup?.year} Section ${b.studentGroup?.section}`;
          break;
        default:
          aValue = a[sortConfig.key] || "";
          bValue = b[sortConfig.key] || "";
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getFilteredActivities = () => {
    const sorted = getSortedActivities();
    if (!searchQuery) return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter((activity) => {
      const studentGroup = activity.studentGroup;
      if (!studentGroup) return false;

      const searchString =
        `${studentGroup.department} Year ${studentGroup.year} Section ${studentGroup.section}`.toLowerCase();
      return searchString.includes(query);
    });
  };

  const handleActivitySelect = (activityId) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleRegenerateSchedule = async () => {
    if (selectedActivities.length === 0) {
      toast.error("Please select at least one activity");
      return;
    }

    try {
      setLoading(true);
      await regenerateSchedule(semesterid, selectedActivities);
      toast.success("Schedule regenerated successfully");
      navigate(`/schedules/${semesterid}`);
    } catch (err) {
      toast.error(err.message || "Failed to regenerate schedule");
    } finally {
      setLoading(false);
    }
  };

  const renderSortableHeader = (label, key) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(key)}
        className="flex items-center gap-1 hover:bg-transparent"
      >
        {label}
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </TableHead>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Reschedule Activities
                </CardTitle>
                <CardDescription>
                  <Calendar className="inline-block w-4 h-4 mr-2" />
                  Semester: {semesterid}
                </CardDescription>
              </div>
              <Button
                onClick={handleRegenerateSchedule}
                disabled={selectedActivities.length === 0}
                className="bg-primary"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Regenerate Selected ({selectedActivities.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student group..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Separator />
              <ScrollArea className="h-[600px] rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            activities.length > 0 &&
                            selectedActivities.length === activities.length
                          }
                          onCheckedChange={(checked) => {
                            setSelectedActivities(
                              checked ? activities.map((a) => a._id) : []
                            );
                          }}
                        />
                      </TableHead>
                      {renderSortableHeader("Course", "course")}
                      {renderSortableHeader("Lecture", "lecture")}
                      {renderSortableHeader("Student Group", "studentGroup")}
                      {renderSortableHeader("Room Type", "roomRequirement")}
                      {renderSortableHeader("Duration", "totalDuration")}
                      {renderSortableHeader("Split", "split")}
                      <TableHead>Semester</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredActivities().map((activity) => (
                      <TableRow key={activity._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedActivities.includes(activity._id)}
                            onCheckedChange={() =>
                              handleActivitySelect(activity._id)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {activity.course?.courseCode}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {activity.course?.name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.lecture?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {activity.studentGroup
                              ? `${activity.studentGroup.department} Year ${activity.studentGroup.year} Section ${activity.studentGroup.section}`
                              : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">
                              {activity.roomRequirement}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.totalDuration} hours</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Split className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.split}</span>
                          </div>
                        </TableCell>
                        <TableCell>{activity.semester}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RescheduleActivities;
