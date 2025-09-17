const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Import all models
const User = require("./models/User");
const Course = require("./models/Course");
const Building = require("./models/Building");
const Room = require("./models/Room");
const StudentGroup = require("./models/StudentGroup");
const Timeslot = require("./models/Timeslot");
const Lecture = require("./models/Lectures");
const Activity = require("./models/Activity");
const Schedule = require("./models/Schedule");
const Representative = require("./models/Representative");
const RepresentativeSession = require("./models/RepresentativeSession");
const PersonalInfo = require("./models/PersonalInformation");
const Notification = require("./models/Notification");
const Attendance = require("./models/Attendance");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  console.log("🗑️  Clearing existing data...");
  await User.deleteMany({});
  await Course.deleteMany({});
  await Building.deleteMany({});
  await Room.deleteMany({});
  await StudentGroup.deleteMany({});
  await Timeslot.deleteMany({});
  await Lecture.deleteMany({});
  await Activity.deleteMany({});
  await Schedule.deleteMany({});
  await Representative.deleteMany({});
  await RepresentativeSession.deleteMany({});
  await PersonalInfo.deleteMany({});
  await Notification.deleteMany({});
  await Attendance.deleteMany({});
  console.log("✅ Data cleared successfully");
};

// Seed data
const seedData = async () => {
  try {
    console.log("🌱 Starting to seed data...");

    // 1. Create Users
    console.log("👥 Creating users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);
    
    const users = await User.insertMany([
      {
        username: "admin",
        name: "teddy",
        role: "admin",
        password: hashedPassword,
      },
      {
        username: "apo",
        name: "yewsef",
        role: "apo",
        password: hashedPassword,
      },
      {
        username: "user1",
        name: "user1",
        role: "apo",
        password: hashedPassword,
      },
      {
        username: "user2",
        name: "user2",
        role: "apo",
        password: hashedPassword,
      },
      {
        username: "user3",
        name: "user3",
        role: "apo",
        password: hashedPassword,
      },        
    ]);

    // 2. Create Buildings
    console.log("🏢 Creating buildings...");
    const buildings = await Building.insertMany([
      { name: "Main Building", active: true },
      { name: "Science Building", active: true },
      { name: "Engineering Building", active: true },
      { name: "Library Building", active: true },
      { name: "Old Building", active: false },
    ]);

    // 3. Create Rooms
    console.log("🚪 Creating rooms...");
    const rooms = await Room.insertMany([
      { name: "A101", capacity: 50, type: "lecture", building: "Main Building", active: true },
      { name: "A102", capacity: 30, type: "lecture", building: "Main Building", active: true },
      { name: "A201", capacity: 100, type: "lecture", building: "Main Building", active: true },
      { name: "S101", capacity: 25, type: "lab", building: "Science Building", active: true },
      { name: "S102", capacity: 20, type: "lab", building: "Science Building", active: true },
      { name: "E101", capacity: 40, type: "lecture", building: "Engineering Building", active: true },
      { name: "E201", capacity: 15, type: "seminar", building: "Engineering Building", active: true },
      { name: "L101", capacity: 60, type: "lecture", building: "Library Building", active: true },
      { name: "O101", capacity: 30, type: "lecture", building: "Old Building", active: false },
    ]);

    // 4. Create Student Groups
    console.log("👨‍🎓 Creating student groups...");
    const studentGroups = await StudentGroup.insertMany([
      { department: "Computer Science", year: 1, section: "A" },
      { department: "Computer Science", year: 1, section: "B" },
      { department: "Computer Science", year: 2, section: "A" },
      { department: "Computer Science", year: 2, section: "B" },
      { department: "Computer Science", year: 3, section: "A" },
      { department: "Computer Science", year: 3, section: "B" },
      { department: "Mathematics", year: 1, section: "A" },
      { department: "Mathematics", year: 2, section: "A" },
      { department: "Physics", year: 1, section: "A" },
      { department: "Physics", year: 2, section: "A" },
    ]);

    // 5. Create Timeslots
    console.log("⏰ Creating timeslots...");
    const timeslots = await Timeslot.insertMany([
      { day: "Monday", startTime: "08:00", endTime: "09:30", preferenceScore: 5 },
      { day: "Monday", startTime: "09:30", endTime: "11:00", preferenceScore: 4 },
      { day: "Monday", startTime: "11:00", endTime: "12:30", preferenceScore: 3 },
      { day: "Monday", startTime: "13:30", endTime: "15:00", preferenceScore: 4 },
      { day: "Monday", startTime: "15:00", endTime: "16:30", preferenceScore: 3 },
      { day: "Tuesday", startTime: "08:00", endTime: "09:30", preferenceScore: 5 },
      { day: "Tuesday", startTime: "09:30", endTime: "11:00", preferenceScore: 4 },
      { day: "Tuesday", startTime: "11:00", endTime: "12:30", preferenceScore: 3 },
      { day: "Tuesday", startTime: "13:30", endTime: "15:00", preferenceScore: 4 },
      { day: "Tuesday", startTime: "15:00", endTime: "16:30", preferenceScore: 3 },
      { day: "Wednesday", startTime: "08:00", endTime: "09:30", preferenceScore: 5 },
      { day: "Wednesday", startTime: "09:30", endTime: "11:00", preferenceScore: 4 },
      { day: "Wednesday", startTime: "11:00", endTime: "12:30", preferenceScore: 3 },
      { day: "Wednesday", startTime: "13:30", endTime: "15:00", preferenceScore: 4 },
      { day: "Wednesday", startTime: "15:00", endTime: "16:30", preferenceScore: 3 },
      { day: "Thursday", startTime: "08:00", endTime: "09:30", preferenceScore: 5 },
      { day: "Thursday", startTime: "09:30", endTime: "11:00", preferenceScore: 4 },
      { day: "Thursday", startTime: "11:00", endTime: "12:30", preferenceScore: 3 },
      { day: "Thursday", startTime: "13:30", endTime: "15:00", preferenceScore: 4 },
      { day: "Thursday", startTime: "15:00", endTime: "16:30", preferenceScore: 3 },
      { day: "Friday", startTime: "08:00", endTime: "09:30", preferenceScore: 5 },
      { day: "Friday", startTime: "09:30", endTime: "11:00", preferenceScore: 4 },
      { day: "Friday", startTime: "11:00", endTime: "12:30", preferenceScore: 3 },
      { day: "Friday", startTime: "13:30", endTime: "15:00", preferenceScore: 4 },
      { day: "Friday", startTime: "15:00", endTime: "16:30", preferenceScore: 3 },
    ]);

    // 6. Create Lectures
    console.log("👨‍🏫 Creating lectures...");
    const lectures = await Lecture.insertMany([
      { name: "Dr. Alice Johnson", maxLoad: 20 },
      { name: "Prof. Bob Smith", maxLoad: 18 },
      { name: "Dr. Carol Davis", maxLoad: 22 },
      { name: "Prof. David Wilson", maxLoad: 16 },
      { name: "Dr. Emma Brown", maxLoad: 20 },
      { name: "Prof. Frank Miller", maxLoad: 15 },
      { name: "Dr. Grace Lee", maxLoad: 25 },
      { name: "Prof. Henry Taylor", maxLoad: 17 },
    ]);

    // 7. Create Courses
    console.log("📚 Creating courses...");
    const courses = await Course.insertMany([
      { courseCode: "CS101", name: "Introduction to Programming", longName: "Introduction to Computer Programming" },
      { courseCode: "CS102", name: "Data Structures", longName: "Data Structures and Algorithms" },
      { courseCode: "CS201", name: "Database Systems", longName: "Introduction to Database Management Systems" },
      { courseCode: "CS202", name: "Software Engineering", longName: "Software Engineering Principles" },
      { courseCode: "CS301", name: "Machine Learning", longName: "Introduction to Machine Learning" },
      { courseCode: "CS302", name: "Computer Networks", longName: "Computer Networks and Security" },
      { courseCode: "MATH101", name: "Calculus I", longName: "Differential and Integral Calculus" },
      { courseCode: "MATH102", name: "Linear Algebra", longName: "Linear Algebra and Applications" },
      { courseCode: "PHYS101", name: "Physics I", longName: "Mechanics and Thermodynamics" },
      { courseCode: "PHYS102", name: "Physics II", longName: "Electricity and Magnetism" },
    ]);

    // 8. Create Representatives
    console.log("👥 Creating representatives...");
    const representatives = await Representative.insertMany([
      { name: "Alex Thompson", studentGroup: studentGroups[0]._id },
      { name: "Sarah Williams", studentGroup: studentGroups[1]._id },
      { name: "Tom Anderson", studentGroup: studentGroups[2]._id },
      { name: "Lisa Garcia", studentGroup: studentGroups[3]._id },
      { name: "Mark Davis", studentGroup: studentGroups[4]._id },
      { name: "Emma Wilson", studentGroup: studentGroups[5]._id },
    ]);

    // 9. Create Personal Information
    console.log("📋 Creating personal information...");
    const personalInfos = await PersonalInfo.insertMany([
      {
        contact_info: {
          email: "teddy@gmail.com",
          tel: "+1-555-0101",
          address: "123 University Ave, City, State 12345"
        },
        personal_info: {
          birth_date: "1985-01-15",
          languages: ["English", "Spanish"],
          bio: "System administrator with 10+ years of experience"
        },
        professional_info: {
          position: "System Administrator",
          education: "MS Computer Science"
        },
        user: users[0]._id
      },
      {
        contact_info: {
          email: "yewsef@gmail.com",
          tel: "+1-555-0102",
          address: "456 Academic St, City, State 12345"
        },
        personal_info: {
          birth_date: "1980-03-22",
          languages: ["English", "French"],
          bio: "Academic planning officer focused on curriculum development"
        },
        professional_info: {
          position: "Academic Planning Officer",
          education: "PhD Education"
        },
        user: users[1]._id
      },
      {
        contact_info: {
          email: "user1@gmail.com",
          tel: "+1-555-0103",
          address: "789 Student Blvd, City, State 12345"
        },
        personal_info: {
          birth_date: "1995-07-10",
          languages: ["English"],
          bio: "Computer Science student passionate about software development"
        },
        professional_info: {
          position: "Student",
          education: "BS Computer Science (In Progress)"
        },
        user: users[2]._id
      }
    ]);

    // 10. Create Activities
    console.log("📝 Creating activities...");
    const activities = await Activity.insertMany([
      {
        course: courses[0]._id,
        lecture: lectures[0]._id,
        studentGroup: studentGroups[0]._id,
        semester: "Fall 2024",
        roomRequirement: "lecture",
        totalDuration: 90,
        split: 90,
        createdBy: users[1]._id
      },
      {
        course: courses[1]._id,
        lecture: lectures[1]._id,
        studentGroup: studentGroups[1]._id,
        semester: "Fall 2024",
        roomRequirement: "lecture",
        totalDuration: 90,
        split: 90,
        createdBy: users[1]._id
      },
      {
        course: courses[2]._id,
        lecture: lectures[2]._id,
        studentGroup: studentGroups[2]._id,
        semester: "Fall 2024",
        roomRequirement: "lab",
        totalDuration: 120,
        split: 60,
        createdBy: users[1]._id
      },
      {
        course: courses[3]._id,
        lecture: lectures[3]._id,
        studentGroup: studentGroups[3]._id,
        semester: "Fall 2024",
        roomRequirement: "seminar",
        totalDuration: 90,
        split: 90,
        createdBy: users[1]._id
      },
      {
        course: courses[4]._id,
        lecture: lectures[4]._id,
        studentGroup: studentGroups[4]._id,
        semester: "Fall 2024",
        roomRequirement: "lecture",
        totalDuration: 90,
        split: 90,
        createdBy: users[1]._id
      }
    ]);

    // 11. Create Schedules
    console.log("📅 Creating schedules...");
    const schedules = await Schedule.insertMany([
      {
        activity: activities[0]._id,
        reservedTimeslots: [timeslots[0]._id, timeslots[1]._id],
        totalDuration: 180,
        room: rooms[0]._id,
        studentGroup: studentGroups[0]._id,
        createdBy: users[1]._id,
        semester: "Fall 2024"
      },
      {
        activity: activities[1]._id,
        reservedTimeslots: [timeslots[5]._id, timeslots[6]._id],
        totalDuration: 180,
        room: rooms[1]._id,
        studentGroup: studentGroups[1]._id,
        createdBy: users[1]._id,
        semester: "Fall 2024"
      },
      {
        activity: activities[2]._id,
        reservedTimeslots: [timeslots[10]._id, timeslots[11]._id, timeslots[12]._id],
        totalDuration: 270,
        room: rooms[3]._id,
        studentGroup: studentGroups[2]._id,
        createdBy: users[1]._id,
        semester: "Fall 2024"
      },
      {
        activity: activities[3]._id,
        reservedTimeslots: [timeslots[15]._id, timeslots[16]._id],
        totalDuration: 180,
        room: rooms[6]._id,
        studentGroup: studentGroups[3]._id,
        createdBy: users[1]._id,
        semester: "Fall 2024"
      },
      {
        activity: activities[4]._id,
        reservedTimeslots: [timeslots[20]._id, timeslots[21]._id],
        totalDuration: 180,
        room: rooms[2]._id,
        studentGroup: studentGroups[4]._id,
        createdBy: users[1]._id,
        semester: "Fall 2024"
      }
    ]);

    // 12. Create Representative Sessions
    console.log("🔐 Creating representative sessions...");
    const representativeSessions = await RepresentativeSession.insertMany([
      {
        rep_id: representatives[0]._id,
        token: "rep_token_1_" + Date.now()
      },
      {
        rep_id: representatives[1]._id,
        token: "rep_token_2_" + Date.now()
      },
      {
        rep_id: representatives[2]._id,
        token: "rep_token_3_" + Date.now()
      }
    ]);

    // 13. Create Notifications
    console.log("🔔 Creating notifications...");
    const notifications = await Notification.insertMany([
      {
        user: users[0]._id,
        title: "System Maintenance",
        message: "Scheduled maintenance will occur tonight from 2 AM to 4 AM",
        type: "info",
        isRead: false,
        severity: "info"
      },
      {
        user: users[1]._id,
        title: "New Schedule Request",
        message: "A new schedule request has been submitted for CS101",
        type: "message",
        isRead: false,
        severity: "info"
      },
      {
        user: users[2]._id,
        title: "Class Reminder",
        message: "Your CS101 class starts in 30 minutes",
        type: "info",
        isRead: true,
        severity: "info"
      },
      {
        user: users[3]._id,
        title: "Room Change",
        message: "Your CS102 class has been moved to room A201",
        type: "warning",
        isRead: false,
        severity: "warning"
      },
      {
        user: users[4]._id,
        title: "Assignment Due",
        message: "Your Data Structures assignment is due tomorrow",
        type: "warning",
        isRead: false,
        severity: "warning"
      }
    ]);

    // 14. Create Attendance Records
    console.log("📊 Creating attendance records...");
    const attendanceRecords = await Attendance.insertMany([
      {
        schedule: schedules[0]._id,
        teacher: lectures[0]._id,
        course: courses[0]._id,
        date: new Date("2024-09-15"),
        status: "present",
        markedBy: representatives[0]._id,
        notes: "All students present",
        arrivalTime: "08:05"
      },
      {
        schedule: schedules[1]._id,
        teacher: lectures[1]._id,
        course: courses[1]._id,
        date: new Date("2024-09-16"),
        status: "present",
        markedBy: representatives[1]._id,
        notes: "One student late",
        arrivalTime: "09:35"
      },
      {
        schedule: schedules[2]._id,
        teacher: lectures[2]._id,
        course: courses[2]._id,
        date: new Date("2024-09-17"),
        status: "absent",
        markedBy: representatives[2]._id,
        notes: "Teacher absent, substitute arranged",
        arrivalTime: "11:10"
      },
      {
        schedule: schedules[3]._id,
        teacher: lectures[3]._id,
        course: courses[3]._id,
        date: new Date("2024-09-18"),
        status: "present",
        markedBy: representatives[3]._id,
        notes: "Regular class",
        arrivalTime: "13:30"
      },
      {
        schedule: schedules[4]._id,
        teacher: lectures[4]._id,
        course: courses[4]._id,
        date: new Date("2024-09-19"),
        status: "late",
        markedBy: representatives[4]._id,
        notes: "Teacher arrived 15 minutes late",
        arrivalTime: "08:15"
      }
    ]);

    console.log("✅ Data seeding completed successfully!");
    console.log("\n📊 Summary of created data:");
    console.log(`👥 Users: ${users.length}`);
    console.log(`🏢 Buildings: ${buildings.length}`);
    console.log(`🚪 Rooms: ${rooms.length}`);
    console.log(`👨‍🎓 Student Groups: ${studentGroups.length}`);
    console.log(`⏰ Timeslots: ${timeslots.length}`);
    console.log(`👨‍🏫 Lectures: ${lectures.length}`);
    console.log(`📚 Courses: ${courses.length}`);
    console.log(`👥 Representatives: ${representatives.length}`);
    console.log(`📋 Personal Info: ${personalInfos.length}`);
    console.log(`📝 Activities: ${activities.length}`);
    console.log(`📅 Schedules: ${schedules.length}`);
    console.log(`🔐 Representative Sessions: ${representativeSessions.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    console.log(`📊 Attendance Records: ${attendanceRecords.length}`);

  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await clearData();
    await seedData();
    console.log("\n🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error in main execution:", error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { seedData, clearData };
