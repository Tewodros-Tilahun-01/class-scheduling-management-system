import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchActivityStats } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import DashboardLayout from "@/layouts/DashboardLayout";

const ActivityStats = () => {
  const { semester } = useParams();
  const decodedSemester = decodeURIComponent(semester);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchActivityStats(decodedSemester);
        setStats(data);
        toast.success("Statistics loaded successfully");
      } catch (err) {
        setError(`Error loading statistics: ${err.message}`);
        toast.error("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [decodedSemester]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent>
            <p className="text-muted-foreground">No statistics available.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Activity Statistics for {decodedSemester}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Activities
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.overview.totalActivities}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Hours
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.overview.totalHours}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Student Groups
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.studentGroups.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Departments
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.departments.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Room Requirements Overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Room Requirements Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Total Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.overview.roomRequirements).map(
                      ([type, data]) => (
                        <TableRow key={type}>
                          <TableCell className="capitalize">{type}</TableCell>
                          <TableCell>{data.count}</TableCell>
                          <TableCell>{data.totalHours}</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Course Statistics */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Course Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Student Groups</TableHead>
                      <TableHead>Lectures</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.totalHours}</TableCell>
                        <TableCell>{course.count}</TableCell>
                        <TableCell>{course.studentGroups}</TableCell>
                        <TableCell>{course.lectures}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Lecture Statistics */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Lecture Workload Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lecture Name</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Student Groups</TableHead>
                      <TableHead>Courses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.lectures.map((lecture) => (
                      <TableRow key={lecture.id}>
                        <TableCell>{lecture.name}</TableCell>
                        <TableCell>{lecture.totalHours}</TableCell>
                        <TableCell>{lecture.count}</TableCell>
                        <TableCell>{lecture.studentGroups}</TableCell>
                        <TableCell>{lecture.courses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Student Group Statistics */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Student Group Workload</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Lectures</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.studentGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.department}</TableCell>
                        <TableCell>{group.year}</TableCell>
                        <TableCell>{group.section}</TableCell>
                        <TableCell>{group.totalHours}</TableCell>
                        <TableCell>{group.count}</TableCell>
                        <TableCell>{group.courses}</TableCell>
                        <TableCell>{group.lectures}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Department Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Student Groups</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Lectures</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell>{dept.id}</TableCell>
                        <TableCell>{dept.totalHours}</TableCell>
                        <TableCell>{dept.count}</TableCell>
                        <TableCell>{dept.studentGroups}</TableCell>
                        <TableCell>{dept.courses}</TableCell>
                        <TableCell>{dept.lectures}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivityStats;
