import { type Complaint } from "@/services/complaintApi"

export interface OptimizedRouteResult {
  orderedTasks: Complaint[]
  totalDistanceKm: number
  totalDurationMins: number
  waypoints: {
    lat: number
    lng: number
    title: string
    stopNumber: number
    taskId: string
  }[]
}

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Extracts coordinate [lat, lng] from complaint model
 */
export const getTaskCoordinates = (task: Complaint): [number, number] => {
  const coords = task.location?.coordinates?.coordinates
  if (coords && coords.length === 2) {
    return [coords[1], coords[0]]
  }
  const locAny = task.location as any
  if (locAny?.lat && locAny?.lng) {
    return [Number(locAny.lat), Number(locAny.lng)]
  }
  // Default fallback across Mumbai wards
  return [19.0760, 72.8777]
}

/**
 * Solves Multi-Stop Traveling Salesperson Problem (TSP) using Nearest Neighbor + 2-Opt Heuristic
 */
export const optimizeDailyTaskRoute = (
  workerStartPos: [number, number],
  tasks: Complaint[]
): OptimizedRouteResult => {
  if (!tasks || tasks.length === 0) {
    return {
      orderedTasks: [],
      totalDistanceKm: 0,
      totalDurationMins: 0,
      waypoints: [],
    }
  }

  if (tasks.length === 1) {
    const coords = getTaskCoordinates(tasks[0])
    const dist = calculateDistanceKm(workerStartPos[0], workerStartPos[1], coords[0], coords[1])
    return {
      orderedTasks: tasks,
      totalDistanceKm: Number(dist.toFixed(1)),
      totalDurationMins: Math.round(dist * 3 + 20), // 3 mins/km + 20 min repair time
      waypoints: [
        {
          lat: coords[0],
          lng: coords[1],
          title: tasks[0].title,
          stopNumber: 1,
          taskId: tasks[0]._id,
        },
      ],
    }
  }

  // ── Step 1: Nearest Neighbor Heuristic ──
  const unvisited = [...tasks]
  const ordered: Complaint[] = []
  let currentLat = workerStartPos[0]
  let currentLng = workerStartPos[1]

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let minDistance = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const [tLat, tLng] = getTaskCoordinates(unvisited[i])
      const dist = calculateDistanceKm(currentLat, currentLng, tLat, tLng)
      if (dist < minDistance) {
        minDistance = dist
        nearestIdx = i
      }
    }

    const [chosen] = unvisited.splice(nearestIdx, 1)
    ordered.push(chosen)
    const [cLat, cLng] = getTaskCoordinates(chosen)
    currentLat = cLat
    currentLng = cLng
  }

  // ── Step 2: 2-Opt Local Optimization ──
  let improved = true
  let iterations = 0
  const maxIterations = 50

  const calculateTourDistance = (tour: Complaint[]): number => {
    let d = 0
    let prevLat = workerStartPos[0]
    let prevLng = workerStartPos[1]
    for (const t of tour) {
      const [tLat, tLng] = getTaskCoordinates(t)
      d += calculateDistanceKm(prevLat, prevLng, tLat, tLng)
      prevLat = tLat
      prevLng = tLng
    }
    return d
  }

  let bestTour = [...ordered]
  let bestDistance = calculateTourDistance(bestTour)

  while (improved && iterations < maxIterations) {
    improved = false
    iterations++

    for (let i = 0; i < bestTour.length - 1; i++) {
      for (let k = i + 1; k < bestTour.length; k++) {
        // Reverse sub-segment [i...k]
        const newTour = [
          ...bestTour.slice(0, i),
          ...bestTour.slice(i, k + 1).reverse(),
          ...bestTour.slice(k + 1),
        ]
        const newDist = calculateTourDistance(newTour)
        if (newDist < bestDistance - 0.05) {
          bestTour = newTour
          bestDistance = newDist
          improved = true
          break
        }
      }
      if (improved) break
    }
  }

  // ── Step 3: Total Metrics & Waypoint Markers ──
  const totalDistanceKm = Number(bestDistance.toFixed(1))
  // Estimated shift duration: driving time (~3 mins per km) + 20 mins repair time per site
  const drivingTimeMins = Math.round(totalDistanceKm * 3.2)
  const workTimeMins = bestTour.length * 20
  const totalDurationMins = drivingTimeMins + workTimeMins

  const waypoints = bestTour.map((task, idx) => {
    const [wLat, wLng] = getTaskCoordinates(task)
    return {
      lat: wLat,
      lng: wLng,
      title: task.title,
      stopNumber: idx + 1,
      taskId: task._id,
    }
  })

  return {
    orderedTasks: bestTour,
    totalDistanceKm,
    totalDurationMins,
    waypoints,
  }
}
