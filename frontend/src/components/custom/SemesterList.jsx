import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { fetchSemesters } from "@/services/api";

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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Semesters</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : semesters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {semesters.map((semester) => (
                <Button key={semester} asChild className="w-full">
                  <Link to={`/schedules/${encodeURIComponent(semester)}`}>
                    {semester}
                  </Link>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No semesters available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SemesterList;
