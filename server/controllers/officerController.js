const User = require("../models/User");
const Officer = require("../models/Officer");
const Department = require("../models/Department");
const { validationResult } = require("express-validator");

exports.addOfficer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, password, departmentId, employeeId, designation } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: "User already exists with this email" });
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, error: "Department not found" });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: "officer",
      department: departmentId
    });

    // Create officer
    const officer = await Officer.create({
      user: user._id,
      department: departmentId,
      employeeId,
      designation
    });

    res.status(201).json({
      success: true,
      officer: {
        _id: officer._id,
        name: user.name,
        email: user.email,
        employeeId: officer.employeeId,
        designation: officer.designation,
        department: department.name
      }
    });

  } catch (error) {
    console.error("Add Officer error:", error);
    res.status(500).json({ success: false, error: "Server error creating officer" });
  }
};

exports.getAllOfficers = async (req, res) => {
  try {
    const { departmentId } = req.query;
    let query = {};
    if (departmentId) {
      query.department = departmentId;
    }

    const officers = await Officer.find(query)
      .populate("user", "name email isActive avatar")
      .populate("department", "name code")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: officers.length,
      officers
    });
  } catch (error) {
    console.error("Get Officers error:", error);
    res.status(500).json({ success: false, error: "Server error fetching officers" });
  }
};

exports.getOfficerPerformance = async (req, res) => {
  try {
    const stats = await Officer.aggregate([
      {
        $group: {
          _id: "$department",
          totalOfficers: { $sum: 1 },
          totalActiveComplaints: { $sum: "$activeComplaintsCount" },
          totalResolvedComplaints: { $sum: "$totalResolved" }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: "$department" },
      {
        $project: {
          _id: 1,
          name: "$department.name",
          code: "$department.code",
          totalOfficers: 1,
          totalActiveComplaints: 1,
          totalResolvedComplaints: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Officer Performance error:", error);
    res.status(500).json({ success: false, error: "Server error fetching performance" });
  }
};
