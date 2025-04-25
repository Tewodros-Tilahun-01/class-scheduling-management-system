import React, { useEffect, useState } from "react";
import { fetchSchedules } from "@/services/api"; // Adjust the path as needed

const ScheduleTable = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await fetchSchedules();
        setSchedules(data);
      } catch (error) {
        console.error("Failed to fetch schedules:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading schedule...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Class Schedule</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">Course</th>
              <th className="py-2 px-4 text-left">Instructor</th>
              <th className="py-2 px-4 text-left">Group</th>
              <th className="py-2 px-4 text-left">Room</th>
              <th className="py-2 px-4 text-left">Day</th>
              <th className="py-2 px-4 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((item) => (
              <tr key={item._id} className="border-b">
                <td className="py-2 px-4">{item.activity?.course?.name}</td>
                <td className="py-2 px-4">{item.activity?.instructor?.name}</td>
                <td className="py-2 px-4">{item.activity?.studentGroup}</td>
                <td className="py-2 px-4">{item.room?.name}</td>
                <td className="py-2 px-4">{item.timeslot?.day}</td>
                <td className="py-2 px-4">
                  {item.timeslot?.startTime} - {item.timeslot?.endTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
