import React, { useState, useEffect } from "react";
import {
  fetchTimeslots,
  addTimeslot,
  updateTimeslot,
  deleteTimeslot,
} from "../services/api"; // Adjust the path to where your API file is located

const TimeslotManager = () => {
  const [timeslots, setTimeslots] = useState([]);
  const [form, setForm] = useState({
    id: null,
    day: "Monday",
    startTime: "08:00",
    endTime: "09:00",
    preferenceScore: 10,
  });
  const [error, setError] = useState(null);

  // Fetch timeslots on mount
  useEffect(() => {
    fetchTimeslotsData();
  }, []);

  const fetchTimeslotsData = async () => {
    try {
      const data = await fetchTimeslots();
      setTimeslots(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch timeslots");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        // Update timeslot
        await updateTimeslot(form.id, {
          day: form.day,
          startTime: form.startTime,
          endTime: form.endTime,
          preferenceScore: form.preferenceScore,
        });
      } else {
        // Add new timeslot
        await addTimeslot({
          day: form.day,
          startTime: form.startTime,
          endTime: form.endTime,
          preferenceScore: form.preferenceScore,
        });
      }
      setForm({
        id: null,
        day: "Monday",
        startTime: "08:00",
        endTime: "09:00",
        preferenceScore: 10,
      });
      fetchTimeslotsData();
      setError(null);
    } catch (err) {
      setError(
        form.id ? "Failed to update timeslot" : "Failed to add timeslot"
      );
    }
  };

  const handleEdit = (timeslot) => {
    setForm({
      id: timeslot._id,
      day: timeslot.day,
      startTime: timeslot.startTime,
      endTime: timeslot.endTime,
      preferenceScore: timeslot.preferenceScore,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteTimeslot(id);
      fetchTimeslotsData();
      setError(null);
    } catch (err) {
      setError("Failed to delete timeslot");
    }
  };

  return (
    <div className="p-4">
      {/* Timeslot Form */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {form.id ? "Edit Timeslot" : "Add Timeslot"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Day</label>
            <select
              name="day"
              value={form.day}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            >
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Start Time (HH:MM)
            </label>
            <input
              type="text"
              name="startTime"
              value={form.startTime}
              onChange={handleInputChange}
              placeholder="08:00"
              pattern="[0-2][0-9]:[0-5][0-9]"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              End Time (HH:MM)
            </label>
            <input
              type="text"
              name="endTime"
              value={form.endTime}
              onChange={handleInputChange}
              placeholder="09:00"
              pattern="[0-2][0-9]:[0-5][0-9]"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Preference Score
            </label>
            <input
              type="number"
              name="preferenceScore"
              value={form.preferenceScore}
              onChange={handleInputChange}
              min="0"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {form.id ? "Update" : "Add"} Timeslot
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() =>
                setForm({
                  id: null,
                  day: "Monday",
                  startTime: "08:00",
                  endTime: "09:00",
                  preferenceScore: 10,
                })
              }
              className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Timeslot Table */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Timeslots</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Day</th>
              <th className="border p-2">Start Time</th>
              <th className="border p-2">End Time</th>
              <th className="border p-2">Preference Score</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timeslots.map((timeslot) => (
              <tr key={timeslot._id} className="hover:bg-gray-100">
                <td className="border p-2">{timeslot.day}</td>
                <td className="border p-2">{timeslot.startTime}</td>
                <td className="border p-2">{timeslot.endTime}</td>
                <td className="border p-2">{timeslot.preferenceScore}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleEdit(timeslot)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(timeslot._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeslotManager;
