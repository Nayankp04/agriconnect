const Produce = require('../models/Produce');
const User = require('../models/User');

// @desc    Create produce listing
// @route   POST /api/produce
// @access  Private/Farmer
const createProduce = async (req, res) => {
  try {
    const {
      cropName,
      variety,
      category,
      quantity,
      unit,
      expectedPrice,
      minOrderQuantity,
      harvestDate,
      availableFrom,
      qualityGrade,
      location,
      images,
      description,
      status,
    } = req.body;

    const resolvedCropName = cropName || req.body.name || 'Crop Produce';
    const resolvedPrice = expectedPrice !== undefined ? Number(expectedPrice) : Number(req.body.pricePerUnit);

    let resolvedCategory = 'Vegetables';
    if (category) {
      const match = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds', 'Dairy', 'Other'].find(
        (c) => c.toLowerCase() === String(category).toLowerCase()
      );
      if (match) resolvedCategory = match;
    }

    const produce = await Produce.create({
      farmer: req.user._id,
      cropName: resolvedCropName,
      variety: variety || 'Standard Native',
      category: resolvedCategory,
      quantity: Number(quantity),
      availableQuantity: req.body.availableQuantity !== undefined ? Number(req.body.availableQuantity) : Number(quantity),
      unit: unit || 'kg',
      expectedPrice: resolvedPrice,
      minOrderQuantity: Number(minOrderQuantity) || 1,
      harvestDate: harvestDate || new Date(),
      availableFrom: availableFrom || new Date(),
      qualityGrade: qualityGrade || 'Grade A',
      location: location || req.user.location,
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
      description: description || 'Fresh high quality produce harvested directly from farm.',
      status: status || 'AVAILABLE',
    });

    const populatedProduce = await Produce.findById(produce._id).populate('farmer', 'name email phone location profileImage');

    res.status(201).json({ success: true, data: populatedProduce });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get produce listings (Marketplace with filters)
// @route   GET /api/produce
// @access  Public
const getProduces = async (req, res) => {
  try {
    const { crop, location, minPrice, maxPrice, quality, minQuantity } = req.query;

    let query = { availableQuantity: { $gt: 0 } };

    if (crop) {
      query.cropName = { $regex: crop, $options: 'i' };
    }

    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.district': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
      ];
    }

    if (quality) {
      query.qualityGrade = quality;
    }

    if (minPrice || maxPrice) {
      query.expectedPrice = {};
      if (minPrice) query.expectedPrice.$gte = Number(minPrice);
      if (maxPrice) query.expectedPrice.$lte = Number(maxPrice);
    }

    if (minQuantity) {
      query.availableQuantity.$gte = Number(minQuantity);
    }

    const produces = await Produce.find(query)
      .populate('farmer', 'name email phone location profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: produces.length, data: produces });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single produce by ID
// @route   GET /api/produce/:id
// @access  Public
const getProduceById = async (req, res) => {
  try {
    const produce = await Produce.findById(req.params.id).populate('farmer', 'name email phone location profileImage');

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce listing not found' });
    }

    res.json({ success: true, data: produce });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update produce listing
// @route   PUT /api/produce/:id
// @access  Private/Farmer/Admin
const updateProduce = async (req, res) => {
  try {
    let produce = await Produce.findById(req.params.id);

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce listing not found' });
    }

    if (produce.farmer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }

    produce = await Produce.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('farmer', 'name email phone location profileImage');

    res.json({ success: true, data: produce });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete produce listing
// @route   DELETE /api/produce/:id
// @access  Private/Farmer/Admin
const deleteProduce = async (req, res) => {
  try {
    const produce = await Produce.findById(req.params.id);

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce listing not found' });
    }

    if (produce.farmer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    await produce.deleteOne();

    res.json({ success: true, message: 'Produce listing removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Quickly update available stock & status
// @route   PATCH /api/produce/:id/stock
// @access  Private/Farmer/Admin
const updateProduceStock = async (req, res) => {
  try {
    const { availableQuantity, status } = req.body;
    const produce = await Produce.findById(req.params.id);

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce listing not found' });
    }

    if (produce.farmer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }

    if (availableQuantity !== undefined) {
      const qty = Number(availableQuantity);
      if (qty < 0) {
        return res.status(400).json({ success: false, message: 'Available quantity cannot be negative' });
      }
      produce.availableQuantity = qty;
      if (qty === 0) {
        produce.status = 'SOLD_OUT';
      } else if (produce.status === 'SOLD_OUT') {
        produce.status = 'AVAILABLE';
      }
    }

    if (status) {
      produce.status = status;
    }

    await produce.save();
    res.json({ success: true, message: 'Stock updated successfully', data: produce });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduce,
  getProduces,
  getProduceById,
  updateProduce,
  deleteProduce,
  updateProduceStock,
};
