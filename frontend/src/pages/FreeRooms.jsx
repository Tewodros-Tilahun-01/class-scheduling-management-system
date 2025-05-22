import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchFreeRooms, fetchTimeslots } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import DashboardLayout from "@/layouts/DashboardLayout";

const FreeRooms = () => {
  const { semester } = useParams();
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTimeslot, setSelectedTimeslot] = useState("");
  const [timeslots, setTimeslots] = useState([]);
  const [freeRooms, setFreeRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTimeslots, setLoadingTimeslots] = useState(false);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    const loadTimeslots = async () => {
      try {
        setLoadingTimeslots(true);
        const data = await fetchTimeslots();
        setTimeslots(data);
      } catch (error) {
        toast.error("Failed to load timeslots", {
          description: error.message,
        });
      } finally {
        setLoadingTimeslots(false);
      }
    };

    loadTimeslots();
  }, []);

  const handleSearch = async () => {
    if (!selectedDay || !selectedTimeslot) {
      toast.error("Please select both day and timeslot");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchFreeRooms(semester, selectedDay, selectedTimeslot);
      setFreeRooms(data);
      toast.success("Free rooms loaded successfully");
    } catch (error) {
      toast.error("Failed to load free rooms", {
        description: error.message,
      });
      setFreeRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeslots = timeslots.filter((ts) => ts.day === selectedDay);

  return (
    <DashboardLayout>
      <div className="container p-8">
        <Card>
          <CardHeader>
            <CardTitle>Free Rooms - {decodeURIComponent(semester)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Select
                value={selectedDay}
                onValueChange={setSelectedDay}
                disabled={loadingTimeslots}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedTimeslot}
                onValueChange={setSelectedTimeslot}
                disabled={!selectedDay || loadingTimeslots}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeslot" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTimeslots.map((ts) => (
                    <SelectItem key={ts._id} value={ts._id}>
                      {ts.startTime}-{ts.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleSearch}
                disabled={loading || !selectedDay || !selectedTimeslot}
              >
                Search
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-24">
                <svg className="animate-spin h-8 w-8 text-gray-500" viewBox="0 0 24 24">
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
            ) : freeRooms.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Department</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {freeRooms.map((room) => (
                    <TableRow key={room._id}>
                      <TableCell>{room.name}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>{room.department}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No free rooms found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FreeRooms; 