const dotenv = require("dotenv");
dotenv.config({ path: "server/.env" });
const connectDB = require("../config/db");
const User = require("../models/User");

async function main() {
  await connectDB();
  let user = await User.findOne({ role: "officer" });
  if (!user) user = await User.findOne({ role: "admin" });
  if (!user) user = await User.findOne({});
  
  const token = user.generateToken();
  const userPayload = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: true,
    ward: user.ward || "Ward H-West"
  };
  
  console.log("TEST_AUTH_TOKEN=" + token);
  console.log("TEST_USER_PAYLOAD=" + JSON.stringify(userPayload));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
