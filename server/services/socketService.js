const { Server } = require("socket.io");

let io = null;

/**
 * Initializes Native Socket.IO WebSocket Gateway on HTTP Server
 */
const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: false,
    },
    transports: ["websocket", "polling"],
  });

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

module.exports = {
  initSocket,
  getIO,
  broadcastComplaintCreated,
  broadcastComplaintAssigned,
  broadcastComplaintResolved,
  broadcastStatusUpdated,
  broadcastHotspotAlert,
};
