const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, "Code cannot exceed 10 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    // Head officer of the department
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    categories: {
      type: [String],
      default: [], // complaint categories handled by this dept
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (v) {
            return !v || v.length === 0 || v.length === 2;
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: name and code indexes are created automatically by unique:true
DepartmentSchema.index({ isActive: 1 });
DepartmentSchema.index({ "location.coordinates": "2dsphere" });

// ─── Virtual: Officer count ───────────────────────────────────────────────────
DepartmentSchema.virtual("officerCount", {
  ref: "Officer",
  localField: "_id",
  foreignField: "department",
  count: true,
});

module.exports = mongoose.model("Department", DepartmentSchema);
