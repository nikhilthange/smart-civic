/**
 * ─── Spatial-Temporal Deduplication & Cluster Merge Engine ────────────────────
 * Clusters duplicate grievance submissions within 35m spatial radius and 6-hour
 * temporal delta into Parent/Child incident hierarchies with cascade resolution.
 */

const Complaint = require("../models/Complaint");
const civicKarmaService = require("./civicKarmaService");

class TicketDeduplicationService {
  /**
   * Distance calculation in meters (Haversine formula)
   */
  calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Evaluates if a new complaint is a duplicate of an existing active incident
   */
  async findDuplicateCluster(newComplaintData) {
    const { category, latitude, longitude, createdAt } = newComplaintData;
    if (!latitude || !longitude) return { isDuplicate: false };

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // Query active complaints in same category created within 6 hours
    let candidateComplaints = [];
    try {
      candidateComplaints = await Complaint.find({
        category,
        createdAt: { $gte: sixHoursAgo },
        status: { $nin: ["resolved", "closed", "rejected"] },
      }).limit(50);
    } catch {
      return { isDuplicate: false };
    }

    for (const parent of candidateComplaints) {
      const parentCoords = parent.location?.coordinates;
      if (parentCoords && parentCoords.length >= 2) {
        const parentLng = parentCoords[0];
        const parentLat = parentCoords[1];
        const distance = this.calculateDistanceMeters(latitude, longitude, parentLat, parentLng);

        if (distance <= 35) {
          return {
            isDuplicate: true,
            parentComplaintId: parent._id,
            parentTicketCode: parent.complaintId || parent._id,
            distanceMeters: distance,
            clusterCount: (parent.childIncidents?.length || 0) + 2,
          };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Cascade resolution and Karma credits to all child incident subscribers
   */
  async cascadeResolutionToCluster(parentComplaintId, resolutionProofUrl) {
    const parent = await Complaint.findById(parentComplaintId);
    if (!parent) return { cascadedCount: 0 };

    const children = await Complaint.find({ parentComplaintId: parent._id });

    let cascadedCount = 0;
    for (const child of children) {
      child.status = "resolved";
      child.resolutionProof = {
        imageUrl: resolutionProofUrl,
        resolvedAt: new Date(),
        cascadedFromParent: parent._id,
      };
      await child.save();

      // Award Civic Karma to child subscriber
      try {
        await civicKarmaService.awardPoints(
          child.citizen,
          50,
          "CLUSTER_RESOLVED",
          `Grievance resolved via Master Cluster #${parent.complaintId || parent._id}`
        );
      } catch {
        // ignore
      }
      cascadedCount++;
    }

    return {
      success: true,
      parentTicketId: parent.complaintId || parent._id,
      cascadedSubscribersCount: cascadedCount,
    };
  }
}

module.exports = new TicketDeduplicationService();
