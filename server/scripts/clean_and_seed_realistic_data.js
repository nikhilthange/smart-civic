const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Officer = require("../models/Officer");
const Worker = require("../models/Worker");

const REALISTIC_MUMBAI_COMPLAINTS = [
  {
    complaintId: "SC-2026-4563DA85",
    title: "Asphalt crater & surface subsidence on Linking Road",
    description: "Deep road crater measuring approximately 2.2m across the northbound lane near Bandra Medical Stores. Poses immediate hazard for two-wheelers and causes traffic slowdowns during morning peak hours.",
    category: "roads_and_infrastructure",
    priority: "critical",
    status: "worker_assigned",
    affectedCitizensCount: 14,
    location: {
      address: "Linking Road, near Bandra Medical Stores, Bandra West, Mumbai 400050",
      city: "Ward H-West",
      coordinates: { type: "Point", coordinates: [72.8347, 19.0596] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        filename: "pothole_crater_evidence.jpg",
        mimetype: "image/jpeg",
        size: 145000
      }
    ]
  },
  {
    complaintId: "SC-2026-8912BC41",
    title: "Garbage accumulation & dumper overflow near Dadar Station",
    description: "Commercial organic refuse and packaging waste overflowing from secondary collection bin on Senapati Bapat Marg, obstructing the pedestrian sidewalk and creating unhygienic conditions.",
    category: "garbage_collection",
    priority: "critical",
    status: "in_progress",
    affectedCitizensCount: 28,
    location: {
      address: "Senapati Bapat Marg, Dadar Flower Market West, Mumbai 400028",
      city: "Ward G-North",
      coordinates: { type: "Point", coordinates: [72.8437, 19.0178] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
        filename: "roadside_waste_overflow.jpg",
        mimetype: "image/jpeg",
        size: 198000
      }
    ]
  },
  {
    complaintId: "SC-2026-3391FE20",
    title: "High-pressure potable water pipeline valve breach",
    description: "Clean drinking water leaking continuously at approximately 80 liters/min from subterranean cast-iron distribution pipe junction opposite Kurla railway subway entrance.",
    category: "water_and_sanitation",
    priority: "critical",
    status: "officer_assigned",
    affectedCitizensCount: 42,
    location: {
      address: "Station Road, near Kurla West Underpass, Kurla, Mumbai 400070",
      city: "Ward L",
      coordinates: { type: "Point", coordinates: [72.8804, 19.0688] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1585687174572-c93d9b01518f?auto=format&fit=crop&w=800&q=80",
        filename: "water_pipe_leakage.jpg",
        mimetype: "image/jpeg",
        size: 162000
      }
    ]
  },
  {
    complaintId: "SC-2026-7840AA19",
    title: "Storm water drain inlet choked with construction silt",
    description: "Roadside storm water drainage grate blocked by dry mortar and debris from nearby redevelopment project, creating localized standing water risk during pre-monsoon showers.",
    category: "storm_water_drains",
    priority: "high",
    status: "resolution_submitted",
    affectedCitizensCount: 19,
    resolutionNotes: "Desilting crew dispatched. 1.2 tons of wet silt and aggregate extracted using vacuum suction truck. Drain flow restored to 100% capacity.",
    resolutionImage: {
      url: "https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80",
      filename: "hindmata_cleared_drain.jpg"
    },
    location: {
      address: "Dr. Babasaheb Ambedkar Road, Hindmata, Parel, Mumbai 400012",
      city: "Ward F-South",
      coordinates: { type: "Point", coordinates: [72.8398, 19.0068] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
        filename: "clogged_drainage_grate.jpg",
        mimetype: "image/jpeg",
        size: 175000
      }
    ]
  },
  {
    complaintId: "SC-2026-9041DD33",
    title: "Non-functional LED street light array on Worli Sea Face",
    description: "Consecutive series of 6 streetlight poles completely unlit between promenade marker 12 and 18, causing severe visibility drop and pedestrian safety concern after 8:00 PM.",
    category: "street_lighting",
    priority: "medium",
    status: "in_progress",
    affectedCitizensCount: 35,
    location: {
      address: "Worli Sea Face Promenade, Khan Abdul Ghaffar Khan Road, Worli, Mumbai 400030",
      city: "Ward G-South",
      coordinates: { type: "Point", coordinates: [72.8142, 19.0112] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
        filename: "unlit_streetlamp_pole.jpg",
        mimetype: "image/jpeg",
        size: 133000
      }
    ]
  },
  {
    complaintId: "SC-2026-6102EE77",
    title: "Broken pavement slabs & exposed utility trench on S.V. Road",
    description: "Cracked interlocking concrete pavers and uneven ground elevation caused by recent optical fiber trenching. Multiple pedestrians have reported tripping hazards.",
    category: "roads_and_infrastructure",
    priority: "high",
    status: "resolved",
    affectedCitizensCount: 22,
    location: {
      address: "Swami Vivekanand Road, near Andheri Subway, Andheri West, Mumbai 400058",
      city: "Ward K-West",
      coordinates: { type: "Point", coordinates: [72.8368, 19.1197] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1584467735867-4297ae2ebcee?auto=format&fit=crop&w=800&q=80",
        filename: "broken_sidewalk_paving.jpg",
        mimetype: "image/jpeg",
        size: 154000
      }
    ]
  },
  {
    complaintId: "SC-2026-2184FF90",
    title: "Damaged cast-iron storm water manhole frame on Colaba Causeway",
    description: "Heavy cast-iron manhole cover displaced and loose in vehicle wheel path, rattling loudly and posing severe tyre blowout hazard near Regal Circle.",
    category: "drainage",
    priority: "critical",
    status: "officer_assigned",
    affectedCitizensCount: 16,
    location: {
      address: "Shahid Bhagat Singh Road (Colaba Causeway), near Regal Cinema, Colaba, Mumbai 400001",
      city: "Ward A",
      coordinates: { type: "Point", coordinates: [72.8315, 18.922] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
        filename: "loose_manhole_cover.jpg",
        mimetype: "image/jpeg",
        size: 180000
      }
    ]
  },
  {
    complaintId: "SC-2026-7201AA54",
    title: "Fallen banyan tree limb blocking northbound carriageway",
    description: "Substantial tree branch broke during high winds, partially blocking the middle traffic lane on 90 Feet Road near Pant Nagar junction.",
    category: "parks_and_recreation",
    priority: "high",
    status: "in_progress",
    affectedCitizensCount: 31,
    location: {
      address: "90 Feet Road, Pant Nagar, Ghatkopar East, Mumbai 400075",
      city: "Ward N",
      coordinates: { type: "Point", coordinates: [72.9082, 19.0864] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
        filename: "fallen_tree_road_blockage.jpg",
        mimetype: "image/jpeg",
        size: 210000
      }
    ]
  },
  {
    complaintId: "SC-2026-5593CC18",
    title: "Commercial encroachment and unauthorized bamboo framing",
    description: "Unauthorized bamboo framework and plastic sheeting erected across public sidewalk, forcing school children and seniors to walk in live vehicular traffic.",
    category: "licensing_and_encroachment",
    priority: "medium",
    status: "officer_assigned",
    affectedCitizensCount: 11,
    location: {
      address: "Hill Road, Bandra West, Mumbai 400050",
      city: "Ward H-West",
      coordinates: { type: "Point", coordinates: [72.8299, 19.0544] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        filename: "sidewalk_stall_encroachment.jpg",
        mimetype: "image/jpeg",
        size: 167000
      }
    ]
  },
  {
    complaintId: "SC-2026-1049BB12",
    title: "Sewage line overflow & stagnant backflow near municipal school",
    description: "Blocked underground sewer main causing sewage effluent to seep onto public road adjacent to MPS School entrance, causing acute health hazard.",
    category: "public_health",
    priority: "critical",
    status: "in_progress",
    affectedCitizensCount: 56,
    location: {
      address: "LBS Marg, Kurla West, Mumbai 400070",
      city: "Ward L",
      coordinates: { type: "Point", coordinates: [72.8756, 19.0728] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
        filename: "street_drainage_overflow.jpg",
        mimetype: "image/jpeg",
        size: 189000
      }
    ]
  },
  {
    complaintId: "SC-2026-8832DD67",
    title: "Open high-voltage junction box on street lighting feeder pillar",
    description: "Metal inspection door missing from municipal streetlight distribution feeder pillar, exposing live 415V electrical copper busbars at ground level near bus stop.",
    category: "electricity",
    priority: "critical",
    status: "officer_assigned",
    affectedCitizensCount: 65,
    location: {
      address: "Subhash Road, Vile Parle East, Mumbai 400057",
      city: "Ward K-East",
      coordinates: { type: "Point", coordinates: [72.8485, 19.0987] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
        filename: "exposed_electrical_pillar.jpg",
        mimetype: "image/jpeg",
        size: 142000
      }
    ]
  },
  {
    complaintId: "SC-2026-6701EE99",
    title: "Damaged sea-wall concrete parapet & safety railing erosion",
    description: "Coastal surge and tidal erosion cracked 4-meter section of concrete balustrade along Marine Drive, creating fall hazard along the promenade.",
    category: "roads_and_infrastructure",
    priority: "high",
    status: "resolved",
    affectedCitizensCount: 40,
    location: {
      address: "Netaji Subhash Chandra Bose Road (Marine Drive), Churchgate, Mumbai 400020",
      city: "Ward C",
      coordinates: { type: "Point", coordinates: [72.8228, 18.9322] }
    },
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
        filename: "damaged_concrete_barrier.jpg",
        mimetype: "image/jpeg",
        size: 195000
      }
    ]
  }
];

async function cleanAndSeedRealData() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set in environment.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas.");

  // Clean out any corrupt test records
  console.log("Purging junk/mock data records...");
  const deleteResult = await Complaint.deleteMany({
    $or: [
      { title: { $regex: /smoke test|bbbb|test|dummy|asdf|qwer|1234/i } },
      { description: { $regex: /smoke test|bbbb|asdf|qwer/i } }
    ]
  });
  console.log(`Purged ${deleteResult.deletedCount} junk test complaints.`);

  let citizen = await User.findOne({ role: "citizen" });
  let officerDoc = await Officer.findOne();
  let workerDoc = await Worker.findOne();

  if (!citizen) {
    citizen = await User.findOne();
  }

  console.log(`Seeding ${REALISTIC_MUMBAI_COMPLAINTS.length} authentic Mumbai civic grievances with real evidence photos...`);
  for (const item of REALISTIC_MUMBAI_COMPLAINTS) {
    const payload = {
      ...item,
      citizen: citizen ? citizen._id : undefined,
      assignedOfficer: officerDoc ? officerDoc._id : null,
      assignedWorker: workerDoc ? workerDoc._id : null,
      isAnonymous: false,
      ward: item.location.city,
      wardName: item.location.city
    };

    await Complaint.findOneAndUpdate(
      { complaintId: item.complaintId },
      { $set: payload },
      { upsert: true, returnDocument: "after" }
    );
  }

  console.log("✅ Successfully seeded realistic civic evidence photos in MongoDB Atlas!");
  await mongoose.disconnect();
}

cleanAndSeedRealData().catch(err => {
  console.error("Clean and seed error:", err);
  process.exit(1);
});
