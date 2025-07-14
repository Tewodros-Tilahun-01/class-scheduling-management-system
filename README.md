# Class Scheduling Management System

A full-stack web application for managing class schedules, lectures, rooms, student groups, and related academic activities. The system provides an intuitive interface for administrators, staff, and users to efficiently organize and manage academic schedules and resources.

---

## Features

### Frontend
- **Dashboard**: Overview of lectures, student groups, courses, and rooms.
- **Lectures Management**: Add, edit, delete, and view lectures.
- **Rooms Management**: Manage rooms, room types, and buildings.
- **Student Groups**: CRUD operations for student groups.
- **Courses**: Manage course information.
- **Activities**: Schedule and manage academic activities.
- **Timeslot Management**: Define and manage available timeslots.
- **User Management**: Administer users and roles.
- **Notifications**: Receive and view system notifications.
- **Authentication**: Secure login and session management.
- **Responsive UI**: Built with React, Tailwind CSS, and modern UI libraries.

### Backend
- **RESTful API**: Built with Express.js and MongoDB (via Mongoose).
- **Authentication & Authorization**: JWT-based authentication, role-based access control.
- **Entities**: Courses, Lectures, Rooms, Buildings, Student Groups, Activities, Schedules, Users, Notifications, and more.
- **Scheduling Logic**: Endpoints for generating and managing class schedules.
- **Admin & User APIs**: Separate routes for admin and general users.
- **Notifications**: API for sending and retrieving notifications.

---

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS, @tanstack/react-table, Radix UI, Axios, Zod, Framer Motion, and more.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, dotenv, cors, cookie-parser.

---

## Project Structure

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
git clone <repo-url>
cd class-scheduling-management-system
```

### 2. Setup the Backend
```bash
cd backend
cp .env.example .env   # Create your environment file and set MONGO_URI
npm install
npm start
```
- The backend will start on `http://localhost:5000` by default.
- Ensure your `.env` file contains the correct `MONGO_URI` for MongoDB.

### 3. Setup the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
- The frontend will start on `http://localhost:5173` by default.

---

## Usage
- Access the frontend at [http://localhost:5173](http://localhost:5173)
- Log in with your credentials (admin/user accounts should be seeded or created via the backend).
- Use the dashboard and navigation to manage lectures, rooms, student groups, courses, activities, and schedules.

---

## Customization
- **Frontend**: Modify components in `frontend/src/` for UI changes.
- **Backend**: Add or update API routes and models in `backend/` as needed.

---

## License
This project is licensed under the ISC License.

---

