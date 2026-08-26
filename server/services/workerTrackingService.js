/**
 * ─── Live Worker Dispatch & ETA Tracking Service ──────────────────────────────
 */

const ticketDeduplicationService = require("./ticketDeduplicationService");

class WorkerTrackingService {
  /**
   * Calculates live ETA and route distance from worker position to incident spot
   */
  calculateDispatchETA(workerCoords, incidentCoords) {
    const distanceMeters = ticketDeduplicationService.calculateDistanceMeters(
      workerCoords[1],
      workerCoords[0],
      incidentCoords[1],
      incidentCoords[0]
    );

    // City traffic speed modeled at ~22 km/h (366 m/min)
    const averageSpeedMetersPerMin = 366;
    const etaMinutes = Math.max(2, Math.round(distanceMeters / averageSpeedMetersPerMin));

    return {
      distanceMeters,
      distanceKm: (distanceMeters / 1000).toFixed(2),
      etaMinutes,
      etaText: etaMinutes <= 3 ? "Arriving in ~2-3 mins" : `${etaMinutes} mins (${(distanceMeters / 1000).toFixed(1)} km away)`,
      status: distanceMeters <= 100 ? "ARRIVED_ON_SITE" : "EN_ROUTE",
    };
  }

  /**
   * Returns mock or real live telemetry for active ticket
   */
  getLiveWorkerTelemetry(ticketId) {
    const workerLng = 72.8310 + (Math.random() * 0.004);
    const workerLat = 19.0520 + (Math.random() * 0.004);
    const incidentLng = 72.8347;
    const incidentLat = 19.0596;

    const eta = this.calculateDispatchETA([workerLng, workerLat], [incidentLng, incidentLat]);

    return {
      ticketId,
      crewName: "BMC Ward H-West Quick Response Crew #3",
      crewLeader: "Suresh Gaikwad (Junior Road Inspector)",
      phone: "+91 98200 44122",
      vehicleType: "JETPATCHER_TRUCK",
      vehiclePlate: "MH-02-BQ-9104",
      workerLocation: [workerLng, workerLat],
      incidentLocation: [incidentLng, incidentLat],
      speedKmph: 24,
      ...eta,
    };
  }
}

module.exports = new WorkerTrackingService();
