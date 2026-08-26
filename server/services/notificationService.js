/**
 * notificationService.js
 * Central service to send:
 *  1. In-app notifications  (MongoDB Notification model)
 *  2. Email notifications   (Nodemailer / SMTP)
 *  3. Push notifications    (Firebase Cloud Messaging)
 */

const Notification = require("../models/Notification");
const User = require("../models/User");

// ─── Lazy-load heavy deps so they don't break the server when unconfigured ────
let transporter = null;
let fcmAdmin = null;

function getMailer() {
  if (transporter) return transporter;
  try {
    const nodemailer = require("nodemailer");
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn("⚠️  Email not configured – set SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
      return null;
    }
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return transporter;
  } catch {
    return null;
  }
}

function getFCM() {
  if (fcmAdmin) return fcmAdmin;
  try {
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_PROJECT_ID) {
        console.warn("⚠️  Firebase not configured – set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env");
        return null;
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    fcmAdmin = admin;
    return fcmAdmin;
  } catch {
    return null;
  }
}

// ─── HTML Email template ──────────────────────────────────────────────────────
function buildEmailHtml({ title, message, actionUrl }) {
  const link = actionUrl ? `${process.env.CLIENT_URL || "http://localhost:5173"}${actionUrl}` : null;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🏛️ Smart Civic AI</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Your City. Your Voice. Resolved.</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:18px;">${title}</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">${message}</p>
              ${link ? `
              <div style="text-align:center;">
                <a href="${link}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                  View Complaint Status →
                </a>
              </div>` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                You're receiving this because you have an account on Smart Civic AI.<br />
                © ${new Date().getFullYear()} Smart Civic AI. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Core send function ───────────────────────────────────────────────────────
/**
 * @param {Object} opts
 * @param {string}  opts.recipientId   - MongoDB User._id
 * @param {string}  opts.complaintId   - MongoDB Complaint._id (optional)
 * @param {string}  opts.type          - Notification type enum
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {string}  opts.actionUrl     - Frontend route (optional)
 */
async function sendNotification({ recipientId, complaintId, type, title, message, actionUrl }) {
  try {
    // 1. Always save in-app notification
    await Notification.send({
      recipient: recipientId,
      complaint: complaintId || null,
      type,
      title,
      message,
      actionUrl,
    });

    // 2. Fetch user for email + FCM token
    const user = await User.findById(recipientId).select("email name fcmToken").lean();
    if (!user) return;

    const promises = [];

    // 3. Email notification
    const mailer = getMailer();
    if (mailer && user.email) {
      promises.push(
        mailer.sendMail({
          from: `"Smart Civic AI" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `Smart Civic: ${title}`,
          html: buildEmailHtml({ title, message, actionUrl }),
        }).catch(err => console.error("Email send error:", err.message))
      );
    }

    // 4. FCM push notification
    const admin = getFCM();
    if (admin && user.fcmToken) {
      promises.push(
        admin.messaging().send({
          token: user.fcmToken,
          notification: { title, body: message },
          webpush: {
            notification: {
              title,
              body: message,
              icon: "/logo.png",
              badge: "/badge.png",
              requireInteraction: true,
            },
            fcmOptions: actionUrl
              ? { link: `${process.env.CLIENT_URL || "http://localhost:5173"}${actionUrl}` }
              : {},
          },
          data: { type, actionUrl: actionUrl || "" },
        }).catch(err => console.error("FCM send error:", err.message))
      );
    }

    await Promise.allSettled(promises);
  } catch (err) {
    console.error("NotificationService Error:", err.message);
  }
}

// ─── Convenience wrappers for each event ─────────────────────────────────────
const notificationService = {
  send: sendNotification,

  complaintCreated: (userId, complaint) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_submitted",
      title: "Complaint Received ✅",
      message: `Your complaint "${complaint.title}" (${complaint.complaintId}) has been submitted successfully.${complaint.status === "ai_verified" ? " It was automatically AI-verified!" : ""}`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  statusUpdated: (userId, complaint, note) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_status_update",
      title: "Complaint Status Update ⚠️",
      message: note || `Your complaint "${complaint.title}" status has been updated.`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  notifyStatusUpdate: (complaint, note) =>
    sendNotification({
      recipientId: complaint.citizen,
      complaintId: complaint._id,
      type: "complaint_status_update",
      title: "Complaint Status Update ⚠️",
      message: note || `Your complaint "${complaint.title}" status has been updated.`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  aiVerified: (userId, complaint) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_status_update",
      title: "Complaint AI-Verified 🤖",
      message: `Your complaint "${complaint.title}" has been automatically verified by our AI system and routed to the appropriate department.`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  wardAssigned: (userId, complaint) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_status_update",
      title: "Ward Assigned 📍",
      message: `Your complaint "${complaint.title}" has been assigned to ${complaint.wardName}.`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  officerAssignedToCitizen: (userId, complaint, officerName) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_assigned",
      title: "Officer Assigned 👮",
      message: `Officer ${officerName} has been assigned to oversee your complaint "${complaint.title}".`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  newComplaintAssignedToOfficer: (officerId, complaint) =>
    sendNotification({
      recipientId: officerId,
      complaintId: complaint._id,
      type: "complaint_assigned",
      title: "New Complaint Assigned 📋",
      message: `You have been assigned a new complaint: "${complaint.title}" (${complaint.complaintId}).`,
      actionUrl: `/dashboard`,
    }),

  workerAssignedToCitizen: (userId, complaint, workerName) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_assigned_worker",
      title: "Worker Assigned 👷",
      message: `Field worker ${workerName} has been dispatched for your complaint "${complaint.title}".`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  complaintAssignedToWorker: (workerId, complaint) =>
    sendNotification({
      recipientId: workerId,
      complaintId: complaint._id,
      type: "complaint_assigned_worker",
      title: "New Field Task Assigned 👷",
      message: `You have a new task assigned: "${complaint.title}".`,
      actionUrl: `/dashboard`, // Or worker queue if separated
    }),

  workerStartedWork: (userId, complaint) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_status_update",
      title: "Work Started 🔧",
      message: `Field work has commenced on your complaint "${complaint.title}".`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  resolutionSubmittedToCitizen: (userId, complaint) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_status_update",
      title: "Resolution Proof Uploaded 📸",
      message: `The field worker has uploaded resolution proof for "${complaint.title}". Pending officer approval.`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),

  resolutionSubmittedToOfficer: (officerId, complaint) =>
    sendNotification({
      recipientId: officerId,
      complaintId: complaint._id,
      type: "complaint_status_update",
      title: "Resolution Proof Uploaded 📸",
      message: `Proof has been uploaded for "${complaint.title}". Awaiting your approval.`,
      actionUrl: `/dashboard`,
    }),

  reworkRequested: (workerId, complaint) =>
    sendNotification({
      recipientId: workerId,
      complaintId: complaint._id,
      type: "complaint_rework_requested",
      title: "Rework Requested ⚠️",
      message: `The officer has requested rework on your resolution for "${complaint.title}".`,
      actionUrl: `/dashboard`,
    }),

  complaintResolved: (userId, complaint) =>
    sendNotification({
      recipientId: userId,
      complaintId: complaint._id,
      type: "complaint_resolved",
      title: "Complaint Resolved 🎉",
      message: `Great news! Your complaint "${complaint.title}" has been successfully resolved. Please share your feedback.`,
      actionUrl: `/complaint/${complaint._id}/track`,
    }),
};

module.exports = notificationService;
