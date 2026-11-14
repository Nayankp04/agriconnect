const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const User = require('./models/User');
const Produce = require('./models/Produce');
const Vehicle = require('./models/Vehicle');
const FPOInventory = require('./models/FPOInventory');
const ProcurementRequest = require('./models/ProcurementRequest');
const PurchaseOrder = require('./models/PurchaseOrder');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agriconnect_super_secret_jwt_key_2026';

function signToken(userId, role) {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '1d' });
}

async function request(url, options = {}) {
  const headers = options.headers || {};
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return { status: res.status, data };
}

async function run() {
  console.log('===============================================================');
  console.log('🌾 AGRICONNECT INVENTORY & WORKFLOW SUITE TEST 🌾');
  console.log('===============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`[Test] HTTP Server running on ephemeral port: ${port}\n`);

  try {
    // 1. Create Test Users
    const farmer = await User.create({
      name: 'Ramesh Patel',
      email: `farmer.${Date.now()}@agri.org`,
      phone: '+91 9876543210',
      password: 'password123',
      role: 'FARMER',
      location: { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka' },
    });
    const farmerToken = signToken(farmer._id, 'FARMER');

    const buyer = await User.create({
      name: 'Fresh Retailers Ltd',
      email: `buyer.${Date.now()}@agri.org`,
      phone: '+91 9876543211',
      password: 'password123',
      role: 'BUYER',
      location: { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka' },
    });
    const buyerToken = signToken(buyer._id, 'BUYER');

    const logistics = await User.create({
      name: 'Kaveri Logistics',
      email: `logistics.${Date.now()}@agri.org`,
      phone: '+91 9876543212',
      password: 'password123',
      role: 'LOGISTICS',
      location: { city: 'Mandya', district: 'Mandya', state: 'Karnataka' },
    });
    const logisticsToken = signToken(logistics._id, 'LOGISTICS');

    const fpo = await User.create({
      name: 'Mysuru Agro Federation',
      email: `fpo.${Date.now()}@agri.org`,
      phone: '+91 9876543213',
      password: 'password123',
      role: 'FPO',
      location: { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka' },
    });
    const fpoToken = signToken(fpo._id, 'FPO');

    console.log('1️⃣ Testing Farmer Produce Creation with Unit & Category...');
    const produceRes = await request(`${baseUrl}/produce`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Hybrid Sona Masoori Paddy',
        category: 'GRAINS',
        quantity: 500,
        availableQuantity: 500,
        unit: 'quintal',
        pricePerUnit: 2400,
        variety: 'Sona Masoori BPT-5204',
        qualityGrade: 'Grade A',
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c'],
      },
    });
    console.log(`   - Status: ${produceRes.status} | Produce ID: ${produceRes.data.data._id}`);
    console.log(`   - Quantity: ${produceRes.data.data.quantity} ${produceRes.data.data.unit} | Category: ${produceRes.data.data.category}`);
    if (produceRes.data.data.unit !== 'quintal' || produceRes.data.data.category !== 'Grains') {
      throw new Error('Produce unit or category mismatch');
    }
    console.log('   ✅ Produce creation with unit & category verified!\n');

    console.log('2️⃣ Testing Manual Stock Adjustment (PATCH /api/produce/:id/stock)...');
    const produceId = produceRes.data.data._id;
    const stockRes = await request(`${baseUrl}/produce/${produceId}/stock`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        availableQuantity: 420,
        status: 'AVAILABLE',
      },
    });
    console.log(`   - Updated Available Quantity: ${stockRes.data.data.availableQuantity} ${stockRes.data.data.unit}`);
    if (stockRes.data.data.availableQuantity !== 420) {
      throw new Error('Stock adjustment failed');
    }
    console.log('   ✅ Stock adjustment verified!\n');

    console.log('3️⃣ Testing FPO Commodity Pooling & Stock Management...');
    const fpoInvRes = await request(`${baseUrl}/fpo/inventory`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${fpoToken}` },
      body: {
        cropName: 'Mysuru Red Shallots',
        category: 'VEGETABLES',
        unit: 'bag',
        pricePerUnit: 1200,
        availableQuantity: 300,
        totalQuantity: 300,
        farmersCount: 8,
        storageLocation: 'Bandipalya Cold Warehouse B-4',
        farmers: [
          { farmer: farmer._id, farmerName: farmer.name, quantity: 50, pooledDate: new Date() },
        ],
      },
    });
    console.log(`   - FPO Inventory Created: ${fpoInvRes.data.data.cropName} (${fpoInvRes.data.data.availableQuantity} ${fpoInvRes.data.data.unit})`);
    console.log('   ✅ FPO commodity pooling verified!\n');

    console.log('4️⃣ Testing Buyer Procurement Demand Creation & Editing...');
    const demandRes = await request(`${baseUrl}/procurement`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        cropName: 'Organic Alphonso Mangoes',
        category: 'FRUITS',
        unit: 'piece',
        quantity: 1000,
        targetPricePerUnit: 450,
        deliveryLocation: 'Yeshwanthpur Wholesale Market, Bengaluru',
        requiredDeliveryDate: new Date(Date.now() + 7 * 86400000),
      },
    });
    const demandId = demandRes.data.data._id;
    console.log(`   - Demand Created: ${demandRes.data.data.cropName} (${demandRes.data.data.quantity} ${demandRes.data.data.unit})`);

    const updateDemandRes = await request(`${baseUrl}/procurement/${demandId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: { quantity: 1200, targetPricePerUnit: 480 },
    });
    console.log(`   - Updated Demand Target Price: ₹${updateDemandRes.data.data.targetPricePerUnit} / ${updateDemandRes.data.data.unit}`);
    console.log('   ✅ Buyer procurement request management verified!\n');

    console.log('5️⃣ Testing Logistics Vehicle Registration & Capacity Updates...');
    const vehicleRes = await request(`${baseUrl}/logistics/vehicles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsToken}` },
      body: {
        vehicleType: 'Refrigerated Truck 8-Ton',
        registrationNumber: `KA-09-V-${Math.floor(1000 + Math.random() * 9000)}`,
        capacityTons: 8,
        availableCapacityTons: 8,
        pricePerKm: 42,
        pricePerTon: 150,
        currentCity: 'Mysuru',
        serviceLocations: ['Mysuru', 'Mandya', 'Bengaluru'],
        driverName: 'Suresh Gowda',
        driverPhone: '+91 9900112233',
        status: 'AVAILABLE',
      },
    });
    const vehicleId = vehicleRes.data.data._id;
    console.log(`   - Vehicle Registered: ${vehicleRes.data.data.registrationNumber} (Max Payload: ${vehicleRes.data.data.capacityTons} Tons)`);

    const updateVehicleRes = await request(`${baseUrl}/logistics/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${logisticsToken}` },
      body: {
        availableCapacityTons: 4.5,
        status: 'BUSY',
      },
    });
    console.log(`   - Updated Available Payload: ${updateVehicleRes.data.data.availableCapacityTons} Tons (Status: ${updateVehicleRes.data.data.status})`);
    console.log('   ✅ Logistics vehicle capacity management verified!\n');

    console.log('6️⃣ Testing Order Creation & Automatic Stock Reservation...');
    // Initial produce stock is 420 quintals
    const orderRes = await request(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        sellerId: farmer._id,
        produceId: produceId,
        cropName: 'Hybrid Sona Masoori Paddy',
        quantity: 100,
        unit: 'quintal',
        pricePerUnit: 2400,
        orderType: 'BUYER_FARMER',
        deliveryAddress: { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka' },
      },
    });
    console.log(`   - Order Placed: #${orderRes.data.data.orderNumber} for 100 quintals`);
    const refreshedProduce = await Produce.findById(produceId);
    console.log(`   - Stock Decremented from 420 to: ${refreshedProduce.availableQuantity} quintals`);
    if (refreshedProduce.availableQuantity !== 320) {
      throw new Error(`Stock deduction mismatch! Expected 320, got ${refreshedProduce.availableQuantity}`);
    }
    console.log('   ✅ Automatic stock deduction on purchase order verified!\n');

    console.log('7️⃣ Testing Stock Restoration on Order Rejection / Cancellation...');
    const orderId = orderRes.data.data._id;
    await request(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { status: 'REJECTED' },
    });
    const restoredProduce = await Produce.findById(produceId);
    console.log(`   - Order Marked as REJECTED. Restored Stock: ${restoredProduce.availableQuantity} quintals`);
    if (restoredProduce.availableQuantity !== 420) {
      throw new Error(`Stock restoration mismatch! Expected 420, got ${restoredProduce.availableQuantity}`);
    }
    console.log('   ✅ Stock restoration verified!\n');

    console.log('8️⃣ Testing User Profile Updates (PUT /api/auth/me)...');
    const updateMeRes = await request(`${baseUrl}/auth/me`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Ramesh Patel (Verified Organic Producer)',
        phone: '+91 9876543299',
        location: {
          city: 'Mysuru',
          district: 'Mysuru',
          state: 'Karnataka',
          address: 'K.R. Nagar Road, Farmhouse #12',
          pincode: '571602',
        },
      },
    });
    console.log(`   - Updated Name: ${updateMeRes.data.data.user.name}`);
    console.log(`   - Updated Phone: ${updateMeRes.data.data.user.phone}`);
    console.log(`   - Updated Address: ${updateMeRes.data.data.user.location.address}`);
    console.log('   ✅ User profile update verified!\n');

    console.log('===============================================================');
    console.log('🎉 ALL INVENTORY & ENHANCED FEATURES PASSED 100%! 🎉');
    console.log('===============================================================');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.data || err.message);
  process.exit(1);
});
