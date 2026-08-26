const { Server } = require("socket.io");

let io = null;

/**
 * Initializes Native Socket.IO WebSocket Gateway on HTTP Server
 * Supports Redis Pub/Sub Adapter for multi-core clustering when REDIS_URL is provided
 */
const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
        ...(corsOptions?.origin && Array.isArray(corsOptions.origin) ? corsOptions.origin : []),
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Optional Redis Adapter for Cluster Mode
  if (process.env.REDIS_URL) {
    try {
      const { createAdapter } = require("@socket.io/redis-adapter");
      const { createClient } = require("redis");
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          console.log("📡 Distributed Redis WebSocket Adapter Mounted for PM2 Cluster");
        })
        .catch((err) => {
          console.warn("⚠️ Redis Adapter connection failed, falling back to in-memory:", err.message);
        });
    } catch {
      console.log("ℹ️ In-Memory WebSocket Adapter Active");
    }
  } else {
    console.log("ℹ️ In-Memory WebSocket Adapter Active");
  }

  io.on("connection", (socket) => {
    console.log(`🔌 WebSocket Client Connected: ${socket.id}`);

    // Join specific rooms: user_id, ward_name, department_id, role
    socket.on("join:room", (room) => {
      if (room) {
        socket.join(room);
        console.log(`📡 Socket ${socket.id} joined room: ${room}`);
      }
    });

    socket.on("leave:room", (room) => {
      if (room) {
        socket.leave(room);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 WebSocket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

/**
 * Broadcasts COMPLAINT_CREATED event
 */
const broadcastComplaintCreated = (complaint) => {
  if (!io) return;
  io.emit("complaint:created", {
    type: "COMPLAINT_CREATED",
    complaintId: complaint._id,
    id: complaint.complaintId,
    title: complaint.title,
    category: complaint.category,
    ward: complaint.ward,
    wardCode: complaint.wardCode,
    department: complaint.department,
    priority: complaint.priority,
    location: complaint.location,
    createdAt: complaint.createdAt,
  });

  // Also emit to specific ward and department channels
  if (complaint.ward) io.to(`ward:${complaint.ward}`).emit("complaint:new", complaint);
  if (complaint.wardCode) io.to(`ward:${complaint.wardCode}`).emit("complaint:new", complaint);
};

/**
 * Broadcasts WORKER/OFFICER DISPATCHED event
 */
const broadcastComplaintAssigned = (complaint, targetRole = "worker") => {
  if (!io) return;
  io.emit("complaint:assigned", {
    type: "COMPLAINT_ASSIGNED",
    complaintId: complaint._id,
    id: complaint.complaintId,
    status: complaint.status,
    assignedWorker: complaint.assignedWorker,
    assignedOfficer: complaint.assignedOfficer,
    targetRole,
  });

  if (complaint.citizen) {
    const citizenId = complaint.citizen._id || complaint.citizen;
    io.to(`user:${citizenId}`).emit("complaint:updated", complaint);
  }
};

/**
 * Broadcasts RESOLUTION event
 */
const broadcastComplaintResolved = (complaint) => {
  if (!io) return;
  io.emit("complaint:resolved", {
    type: "COMPLAINT_RESOLVED",
    complaintId: complaint._id,
    id: complaint.complaintId,
    status: "resolved",
    resolvedAt: complaint.resolvedAt,
    resolutionNotes: complaint.resolutionNotes,
    resolutionImage: complaint.resolutionImage,
  });

  if (complaint.citizen) {
    const citizenId = complaint.citizen._id || complaint.citizen;
    io.to(`user:${citizenId}`).emit("complaint:resolved_alert", complaint);
  }
};

/**
 * Broadcasts generic status update event
 */
const broadcastStatusUpdated = (complaint) => {
  if (!io) return;
  io.emit("complaint:status_updated", {
    complaintId: complaint._id,
    id: complaint.complaintId,
    status: complaint.status,
    priority: complaint.priority,
    updatedAt: complaint.updatedAt,
  });
};

/**
 * Broadcasts Predictive Monsoon Flood Hotspot Emergency Alert
 */
const broadcastHotspotAlert = (hotspotData) => {
  if (!io) return;
  io.emit("HOTSPOT_ALERT", {
    type: "HOTSPOT_ALERT",
    ward: hotspotData.ward,
    lat: hotspotData.lat,
    lng: hotspotData.lng,
    count: hotspotData.count,
    message: hotspotData.message || `Monsoon Flood Hotspot Alert: Multiple drainage incidents reported in ${hotspotData.ward}!`,
    timestamp: hotspotData.timestamp || new Date().toISOString(),
  });

  if (hotspotData.ward) {
    io.to(`ward:${hotspotData.ward}`).emit("ward:emergency_hotspot", hotspotData);
  }
};

/**
 * Broadcasts generic notification or event to a specific user
 */
const notifyUser = (userId, data) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit("notification", data);
};

/**
 * Broadcasts to a specific ward room
 */
const broadcastToWard = (ward, event, data) => {
  if (!io || !ward) return;
  io.to(`ward:${ward}`).emit(event, data);
};

/**
 * Broadcasts to a specific department room
 */
const broadcastToDepartment = (dept, event, data) => {
  if (!io || !dept) return;
  io.to(`dept:${dept}`).emit(event, data);
};

module.exports = {
  initSocket,
  init: initSocket,
  getIO,
  broadcastComplaintCreated,
  broadcastComplaintUpdated: broadcastStatusUpdated,
  broadcastComplaintAssigned,
  broadcastComplaintResolved,
  broadcastStatusUpdated,
  broadcastStatusChange: broadcastStatusUpdated,
  broadcastHotspotAlert,
  notifyUser,
  broadcastToWard,
  broadcastToDepartment,
};
