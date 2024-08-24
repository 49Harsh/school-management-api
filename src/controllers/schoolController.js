const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

exports.addSchool = async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Input validation
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
  }

  try {
    const school = await prisma.school.create({
      data: {
        name,
        address,
        latitude,
        longitude
      }
    });

    res.status(201).json({ message: 'School added successfully', schoolId: school.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the school' });
  }
};

exports.listSchools = async (req, res) => {
  const { latitude, longitude } = req.query;

  // Input validation
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: 'Invalid latitude or longitude' });
  }

  try {
    const schools = await prisma.school.findMany();

    // Calculate distances and sort
    const schoolsWithDistance = schools.map(school => ({
      ...school,
      distance: calculateDistance(userLat, userLon, school.latitude, school.longitude)
    }));

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching schools' });
  }
};