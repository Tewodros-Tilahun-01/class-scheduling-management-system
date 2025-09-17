# Class Scheduling Management System

A full‑stack web application for managing class schedules, lectures, rooms, student groups, and related academic activities. The system provides an intuitive interface for administrators, staff, and users to efficiently organize and manage academic schedules and resources.

You can find the mobile app in this repository:
[scheduling-mobile](https://github.com/Yosef64/scheduling-mobile)
---

## Features

### Frontend
- **Dashboard**: Overview of lectures, student groups, courses, and rooms.
- **Lecture management**: Add, edit, delete, and view lectures.
- **Room management**: Manage rooms, room types, and buildings.
- **Student groups**: Full CRUD for student groups.
- **Courses**: Manage course information.
- **Activities**: Schedule and manage academic activities.
- **Timeslot management**: Define and manage available timeslots.
- **User management**: Administer users and roles.
- **Notifications**: Receive and view system notifications.
- **Authentication**: Secure login and session management.
- **Responsive UI**: Built with React, Tailwind CSS, and modern UI libraries.

### Backend
- **RESTful API**: Built with Express.js and MongoDB (via Mongoose).
- **Authentication & authorization**: JWT‑based auth, role‑based access control.
- **Entities**: Courses, lectures, rooms, buildings, student groups, activities, schedules, users, notifications, and more.
- **Scheduling logic**: Endpoints for generating and managing class schedules.
- **Admin & user APIs**: Separate routes for admin and general users.
- **Notifications**: API for sending and retrieving notifications.

---

## Technologies

- **Frontend**: React, Vite, Tailwind CSS, @tanstack/react-table, Radix UI, Axios, Zod, Framer Motion, and more.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, dotenv, CORS, cookie‑parser.

---

## Project structure

```
class-scheduling-management-system/
├── frontend/      # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/       # Express.js backend
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── config/
│   ├── index.js
│   ├── package.json
│   └── ...
└── README.md      # Project documentation
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- MongoDB (local or remote instance)

### 1. Clone the Repository
```bash
git clone https://github.com/Tewodros-Tilahun-01/class-scheduling-management-system.git
cd class-scheduling-management-system
```

### 2. Setup the Backend
```bash
cd backend
# Create a .env file and set MONGO_URI
# MONGO_URI = mongodb://localhost:27017/CSMSDATABASE
# JWT_SECRET = highsecret
npm install
npm run seed # create the dummy data
npm start
```
- The backend will start on `http://localhost:5000` by default.
- Ensure your `.env` file contains the correct `MONGO_URI` for MongoDB.


### 3. Setup the Frontend
```bash
cd ../frontend
# Create a .env file and set:
# VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

- Ensure your `.env` file contains the correct `VITE_API_URL` (default: `http://localhost:5000`).
- The frontend will start on `http://localhost:5173` by default.

---

## Usage
- Access the frontend at [http://localhost:5173](http://localhost:5173).
- Log in with your credentials (admin/user accounts are seeded or can be created via the backend).
- Use the dashboard and navigation to manage lectures, rooms, student groups, courses, activities, and schedules.

---

[![Watch the video](https://img.youtube.com/vi/snGwK4Vb524/maxresdefault.jpg)](https://youtu.be/snGwK4Vb524)
---

## Customization
- **Frontend**: Modify components in `frontend/src/` for UI changes.
- **Backend**: Add or update API routes and models in `backend/` as needed.

---






