const { Server } = require("socket.io");

let io = null;

/**
 * Initializes Native Socket.IO WebSocket Gateway on HTTP Server
 * Supports Redis Pub/Sub Adapter for multi-core clustering when REDIS_URL is provided
 */
const initSocket = (httpServer, corsOptions) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    maxHttpBufferSize: 1e6, // 1MB buffer cap to prevent backpressure memory exhaustion
    pingTimeout: 20000,     // 20s timeout for zombie connection eviction
    pingInterval: 10000,    // 10s ping interval for rapid health detection
  });

const jwt = require("jsonwebtoken");

  // Optional Redis Adapter for Multi-Replica Cluster Mode
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    try {
      const { createAdapter } = require("@socket.io/redis-adapter");
      const { createClient } = require("redis");
      const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;
      const pubClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            const jitter = Math.floor(Math.random() * 200); // 0-200ms randomized jitter
            return Math.min(retries * 100 + jitter, 3000);
          },
        },
      });
      const subClient = pubClient.duplicate();

      pubClient.on("error", (err) => console.warn("⚠️ Redis PubClient warning:", err.message));
      subClient.on("error", (err) => console.warn("⚠️ Redis SubClient warning:", err.message));

      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          console.log("📡 Distributed Redis Pub/Sub WebSocket Adapter Mounted for Multi-Replica Mesh");
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

  // ─── Socket Authentication Middleware ───────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (token) {
        const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "ci_production_grade_jwt_secret_2026");
        if (secret) {
          const verified = jwt.verify(token, secret);
          if (verified) {
            socket.user = verified;
          }
        }
      }
    } catch {
      // Allow unauthenticated connection for public broadcasts, but without socket.user
    }
    next();
  });

  io.on("connection", (socket) => {
    console.log(`🔌 WebSocket Client Connected: ${socket.id}`);

    // Join specific rooms: user_id, ward_name, department_id, role with authorization checks
    socket.on("join:room", (room) => {
      if (!room) return;

      // ─── Privileged Room Authorization Guard ──────────────────────────────
      if (room.startsWith("admin")) {
        if (!socket.user || socket.user.role !== "admin") {
          return socket.emit("error", { message: "Unauthorized room subscription: admin privilege required" });
        }
      } else if (room.startsWith("user:")) {
        const targetUserId = room.replace("user:", "");
        const currentUserId = socket.user?.id || socket.user?._id;
        if (!socket.user || (currentUserId !== targetUserId && socket.user.role !== "admin")) {
          return socket.emit("error", { message: "Unauthorized room subscription: private user channel" });
        }
      } else if (room.startsWith("dept:")) {
        if (!socket.user || (socket.user.role !== "admin" && socket.user.role !== "officer")) {
          return socket.emit("error", { message: "Unauthorized room subscription: departmental channel" });
        }
      }

      socket.join(room);
      console.log(`📡 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("join:ward", (ward) => {
      if (ward) {
        socket.join(`ward:${ward}`);
        socket.join(`ward-${ward}`);
        console.log(`📡 Socket ${socket.id} joined ward room: ward:${ward}`);
      }
    });

    socket.on("leave:room", (room) => {
      if (room) {
        socket.leave(room);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 WebSocket Client Disconnected: ${socket.id}`);
      socket.removeAllListeners();
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
