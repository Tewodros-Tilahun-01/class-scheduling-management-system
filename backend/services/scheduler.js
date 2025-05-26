const { Worker } = require("worker_threads");
const path = require("path");
const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");
require("../models/User");

// Store active workers
const activeWorkers = new Map();

// Cleanup completed workers periodically
setInterval(() => {
  for (const [workerId, worker] of activeWorkers.entries()) {
    if (worker.status === "completed" || worker.status === "failed") {
      try {
        worker.worker.terminate();
        activeWorkers.delete(workerId);
      } catch (error) {
        console.error(`Error cleaning up worker ${workerId}:`, error);
      }
    }
  }
}, 600000); // Cleanup every 10 minutes

/*
 * Main scheduling function to generate a conflict-free schedule for a semester.
 * Uses backtracking with forward checking to assign timeslots and rooms.
 * IMPORTANT: Deletes existing schedules for the semester before saving new ones.
 * IMPORTANT: No checks against existing schedules; ensure no concurrent runs to avoid overwrites.
 */
async function generateSchedule(semester, userId) {
  if (!semester) {
    throw new Error("Semester is required");
  }

  // Create a new worker
  const worker = new Worker(
    path.join(__dirname, "../workers/schedulerWorker.js")
  );
  const workerId = Date.now().toString();

  // Store worker info
  activeWorkers.set(workerId, {
    worker,
    status: "running",
    progress: 0,
    result: null,
    error: null,
    startTime: Date.now(),
  });

  // Handle worker messages
  worker.on("message", (message) => {
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      workerInfo.status = message.status;
      workerInfo.progress = message.progress;
      if (message.result) workerInfo.result = message.result;
      if (message.error) workerInfo.error = message.error;
    }
  });

  // Handle worker errors
  worker.on("error", (error) => {
    console.error(`Worker ${workerId} error:`, error);
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      workerInfo.status = "failed";
      workerInfo.error = error.message || "Worker error occurred";
    }
  });

  // Handle worker exit
  worker.on("exit", (code) => {
    console.log(`Worker ${workerId} exited with code ${code}`);
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      if (code !== 0) {
        workerInfo.status = "failed";
        workerInfo.error = `Worker stopped with exit code ${code}`;
      } else if (workerInfo.status === "running") {
        workerInfo.status = "completed";
      }
    }
  });

  // Start the worker
  try {
    worker.postMessage({ semester, userId });
  } catch (error) {
    console.error(`Error starting worker ${workerId}:`, error);
    worker.terminate();
    activeWorkers.delete(workerId);
    throw new Error("Failed to start schedule generation worker");
  }

  return { workerId };
}

// Add function to check worker status
async function checkWorkerStatus(workerId) {
  const workerInfo = activeWorkers.get(workerId);
  if (!workerInfo) {
    throw new Error("Worker not found");
  }

  // Check if worker has been running too long (e.g., 30 minutes)
  const MAX_RUNTIME = 30 * 60 * 1000; // 30 minutes in milliseconds
  if (
    workerInfo.status === "running" &&
    Date.now() - workerInfo.startTime > MAX_RUNTIME
  ) {
    workerInfo.status = "failed";
    workerInfo.error = "Worker exceeded maximum runtime";
    try {
      workerInfo.worker.terminate();
    } catch (error) {
      console.error(
        `Error terminating long-running worker ${workerId}:`,
        error
      );
    }
  }

  return {
    status: workerInfo.status,
    progress: workerInfo.progress,
    result: workerInfo.result,
    error: workerInfo.error,
  };
}

/*
 * Reschedules specific activities while keeping other schedules unchanged.
 * Useful for handling dropout scenarios or specific rescheduling needs.
 * @param {string} semester - The semester identifier
 * @param {string[]} activityIds - Array of activity IDs to regenerateSchedule
 * @param {string} userId - The user ID performing the rescheduling
 * @returns {Object} Grouped schedules with the rescheduled activities
 */
async function regenerateSchedule(semester, activityIds, userId) {
  if (!semester || !Array.isArray(activityIds) || activityIds.length === 0) {
    throw new Error("Semester and activity IDs array are required");
  }

  // Create a new worker
  const worker = new Worker(
    path.join(__dirname, "../workers/regenerateScheduleWorker.js")
  );
  const workerId = Date.now().toString();

  // Store worker info
  activeWorkers.set(workerId, {
    worker,
    status: "running",
    progress: 0,
    result: null,
    error: null,
    startTime: Date.now(),
  });

  // Handle worker messages
  worker.on("message", (message) => {
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      workerInfo.status = message.status;
      workerInfo.progress = message.progress;
      if (message.result) workerInfo.result = message.result;
      if (message.error) workerInfo.error = message.error;
    }
  });

  // Handle worker errors
  worker.on("error", (error) => {
    console.error(`Worker ${workerId} error:`, error);
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      workerInfo.status = "failed";
      workerInfo.error = error.message || "Worker error occurred";
    }
  });

  // Handle worker exit
  worker.on("exit", (code) => {
    console.log(`Worker ${workerId} exited with code ${code}`);
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      if (code !== 0) {
        workerInfo.status = "failed";
        workerInfo.error = `Worker stopped with exit code ${code}`;
      } else if (workerInfo.status === "running") {
        workerInfo.status = "completed";
      }
    }
  });

  // Start the worker
  try {
    worker.postMessage({
      semester,
      userId,
      activityIds,
      isRegeneration: true,
    });
  } catch (error) {
    console.error(`Error starting worker ${workerId}:`, error);
    worker.terminate();
    activeWorkers.delete(workerId);
    throw new Error("Failed to start schedule regeneration worker");
  }

  return { workerId };
}

module.exports = { generateSchedule, regenerateSchedule, checkWorkerStatus };
