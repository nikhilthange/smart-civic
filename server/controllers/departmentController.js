const Department = require("../models/Department");

// ─── @desc    Get nearby departments
// ─── @route   GET /api/departments/nearby
// ─── @access  Private
const getNearbyDepartments = async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query; // Default 10km radius

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    const departments = await Department.find({
      isActive: true,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius), // in meters
        },
      },
    }).limit(5);

    return res.status(200).json({ success: true, departments });
  } catch (error) {
    console.error("GetNearbyDepartments Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching nearby departments." });
  }
};

module.exports = { getNearbyDepartments };
