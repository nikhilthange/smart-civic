const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const existing = await User.findOne({ email: 'admin@smartcivic.com' });
    if (existing) {
      console.log("Admin account already exists! Email: admin@smartcivic.com");
      process.exit();
    }

    const admin = new User({
      name: 'System Admin',
      email: 'admin@smartcivic.com',
      password: 'password123', // Will be securely hashed automatically
      role: 'admin',
      phoneNumber: '9999999999'
    });
    
    await admin.save();
    console.log("✅ Admin account created successfully!");
    console.log("Email: admin@smartcivic.com");
    console.log("Password: password123");
    
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    process.exit();
  }
}

createAdmin();
