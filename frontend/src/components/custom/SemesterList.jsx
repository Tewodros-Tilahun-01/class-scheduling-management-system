import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
        } else {
          setSemesters([]);
        }
      } catch (err) {
        setError(
          `Error fetching semesters: ${
            err.response?.data?.error || err.message
          }`
        );
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
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
