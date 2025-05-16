const mongoose = require("mongoose");
const Timeslot = require("./models/Timeslot"); // Adjust path to your Timeslot model

async function migrateTimeslots() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/your_database_name", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Delete existing timeslots
    await Timeslot.deleteMany({});
    console.log("Deleted all existing timeslots");

    // Define days and time range (2:00 PM to 11:00 PM)
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startHour = 14; // 2:00 PM
    const endHour = 23; // 11:00 PM
    const newTimeslots = [];

    // Generate 1-hour timeslots
    for (const day of days) {
      for (let hour = startHour; hour < endHour; hour++) {
        const startHour12 = hour > 12 ? hour - 12 : hour;
        const startTime = `${startHour12}:00`;
        const endHour12 = hour + 1 > 12 ? hour + 1 - 12 : hour + 1;
        const endTime = `${endHour12}:00`;

        newTimeslots.push({
          day,
          startTime,
          endTime,
          preferenceScore: 10,
          isDeleted: false,
          isReserved: false,
        });
      }
    }

    // Insert new timeslots
    await Timeslot.insertMany(newTimeslots);
    console.log(`Inserted ${newTimeslots.length} new 1-hour timeslots`);

    // Verify inserted timeslots
    const insertedTimeslots = await Timeslot.find().lean();
    for (const timeslot of insertedTimeslots) {
      if (timeslot.duration !== 60) {
        console.warn(
          `Timeslot ${timeslot._id} has incorrect duration: ${timeslot.duration}`
        );
      }
      console.log(
        `Verified timeslot ${timeslot._id}: ${timeslot.day} ${timeslot.startTime}–${timeslot.endTime}, duration=${timeslot.duration}`
      );
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
migrateTimeslots();
