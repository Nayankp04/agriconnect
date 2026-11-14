const FPOProfile = require('../models/FPOProfile');
const FPOInventory = require('../models/FPOInventory');
const ProcurementRequest = require('../models/ProcurementRequest');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get or update FPO profile
const getFPOProfile = async (req, res) => {
  try {
    let profile = await FPOProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await FPOProfile.create({ user: req.user._id, fpoName: `${req.user.name} FPO` });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFPOProfile = async (req, res) => {
  try {
    const profile = await FPOProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get FPO aggregated inventory
const getFPOInventory = async (req, res) => {
  try {
    const inventory = await FPOInventory.find({ fpo: req.user._id })
      .populate('sourceFarmers.farmer', 'name email phone location');
    res.json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add or manually adjust FPO inventory entry
const addFPOInventory = async (req, res) => {
  try {
    const { cropName, category, variety, totalQuantity, qualityGrade, unit, pricePerUnit, images, location } = req.body;

    let resolvedCategory = 'Grains';
    if (category) {
      const match = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds', 'Dairy', 'Other'].find(
        (c) => c.toLowerCase() === String(category).toLowerCase()
      );
      if (match) resolvedCategory = match;
    }

    let item = await FPOInventory.findOne({ fpo: req.user._id, cropName });

    if (item) {
      item.totalQuantity += Number(totalQuantity);
      item.availableQuantity += Number(totalQuantity);
      if (qualityGrade) item.qualityGrade = qualityGrade;
      if (pricePerUnit) item.pricePerUnit = Number(pricePerUnit);
      item.category = resolvedCategory;
      if (images && images.length) item.images = images;
      await item.save();
    } else {
      item = await FPOInventory.create({
        fpo: req.user._id,
        cropName,
        category: resolvedCategory,
        variety: variety || 'Grade A Standard',
        totalQuantity: Number(totalQuantity),
        availableQuantity: Number(totalQuantity),
        reservedQuantity: 0,
        qualityGrade: qualityGrade || 'Grade A',
        unit: unit || 'kg',
        pricePerUnit: Number(pricePerUnit) || 50,
        images: images || [],
        location: location || req.user.location,
      });
    }

    res.status(201).json({ success: true, message: 'FPO inventory item updated', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update single FPO inventory item (price, available quantity, status)
const updateFPOInventory = async (req, res) => {
  try {
    const item = await FPOInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    if (item.fpo.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this inventory item' });
    }

    const { availableQuantity, totalQuantity, pricePerUnit, qualityGrade, status } = req.body;

    if (availableQuantity !== undefined) item.availableQuantity = Number(availableQuantity);
    if (totalQuantity !== undefined) item.totalQuantity = Number(totalQuantity);
    if (pricePerUnit !== undefined) item.pricePerUnit = Number(pricePerUnit);
    if (qualityGrade) item.qualityGrade = qualityGrade;
    if (status) item.status = status;

    await item.save();
    res.json({ success: true, message: 'FPO inventory updated successfully', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete FPO inventory entry
const deleteFPOInventory = async (req, res) => {
  try {
    const item = await FPOInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    if (item.fpo.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this inventory item' });
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Inventory item removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    FPO Dashboard statistics & metrics
const getFPODashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const procurements = await ProcurementRequest.find({ requester: userId });
    const inventory = await FPOInventory.find({ fpo: userId });

    const totalAggregatedQty = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);

    // Unique farmers connected
    const farmerSet = new Set();
    inventory.forEach((item) => {
      item.sourceFarmers.forEach((sf) => {
        if (sf.farmer) farmerSet.add(sf.farmer.toString());
      });
    });

    const orders = await PurchaseOrder.find({ $or: [{ buyer: userId }, { seller: userId }] });

    const activeOrders = orders.filter((o) => ['PENDING', 'ACCEPTED', 'IN_FULFILLMENT'].includes(o.status)).length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;

    const revenue = orders
      .filter((o) => o.seller.toString() === userId.toString() && (o.status === 'COMPLETED' || o.paymentStatus === 'PAID'))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      data: {
        procurementCount: procurements.length,
        farmersConnected: farmerSet.size,
        totalAggregatedQty,
        activeOrders,
        pendingOrders,
        completedOrders,
        revenue,
        inventory,
        procurements,
        recentOrders: orders.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFPOProfile,
  updateFPOProfile,
  getFPOInventory,
  addFPOInventory,
  updateFPOInventory,
  deleteFPOInventory,
  getFPODashboard,
};
