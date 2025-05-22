import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { fetchSemesters } from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SemesterList = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester) => (
                  <TableRow key={semester}>
                    <TableCell className="font-medium">{semester}</TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <Button asChild variant="link" size="sm">
                          <Link
                            to={`/schedules/${encodeURIComponent(semester)}`}
                          >
                            Student Groups
                          </Link>
                        </Button>
                        <Button asChild variant="link" size="sm">
                          <Link
                            to={`/schedules/${encodeURIComponent(
                              semester
                            )}/lectures`}
                          >
                            Lectures
                          </Link>
                        </Button>
                        <Button asChild variant="link" size="sm">
                          <Link
                            to={`/schedules/${encodeURIComponent(
                              semester
                            )}/reschedule`}
                          >
                            Reschedule
                          </Link>
                        </Button>
                        <Button asChild variant="link" size="sm">
                          <Link
                            to={`/schedules/${encodeURIComponent(
                              semester
                            )}/free-rooms`}
                          >
                            Free Rooms
                          </Link>
                        </Button>
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
