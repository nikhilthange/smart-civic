const dotenv = require("dotenv");
dotenv.config({ path: "server/.env" });
const connectDB = require("../config/db");
const User = require("../models/User");

async function main() {
  await connectDB();

  const roleSpecs = [
    { role: "citizen", email: "test.citizen.rbac@mumbai.gov.in", name: "Citizen Test User", ward: "Ward H-West" },
    { role: "worker", email: "test.worker.rbac@mumbai.gov.in", name: "Field Worker Test User", ward: "Ward H-West" },
    { role: "officer", email: "test.officer.rbac@mumbai.gov.in", name: "Municipal Officer Test User", ward: "Ward H-West" },
    { role: "admin", email: "test.admin.rbac@mumbai.gov.in", name: "Admin Commissioner Test User", ward: "Ward H-West" }
  ];

  const credentials = {};

  for (const spec of roleSpecs) {
    let user = await User.findOne({ email: spec.email });
    if (!user) {
      user = await User.findOne({ role: spec.role });
    }
    if (!user) {
      user = await User.create({
        name: spec.name,
        email: spec.email,
        password: "Password@123!",
        role: spec.role,
        ward: spec.ward,
        isActive: true,
        isEmailVerified: true
      });
    }

    const token = user.generateToken();
    credentials[spec.role] = {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: true,
        ward: user.ward || "Ward H-West"
      }
    };
  }

  console.log("ROLE_CREDENTIALS_JSON_START");
  console.log(JSON.stringify(credentials));
  console.log("ROLE_CREDENTIALS_JSON_END");
  process.exit(0);
}

main().catch(err => {
  console.error("Error generating role credentials:", err);
  process.exit(1);
});
