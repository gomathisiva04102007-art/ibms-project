const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// @desc    Get all products & services with search, filter, pagination
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, category, type, status, sort, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    let sortOption = { name: 1 };
    if (sort === 'price_asc') sortOption = { unitPrice: 1 };
    else if (sort === 'price_desc') sortOption = { unitPrice: -1 };
    else if (sort === 'name_desc') sortOption = { name: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
    ]);

    // Distinct categories for quick filtering in UI
    const categories = await Product.distinct('category', { user: req.user._id });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      categories,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product or service
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      code,
      hsnCode,
      description,
      type,
      category,
      unitPrice,
      gstRate,
      unit,
      isActive,
    } = req.body;

    if (!name || unitPrice === undefined || gstRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, unit price, and GST rate are required.',
      });
    }

    const priceNum = Number(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price must be a non-negative number.',
      });
    }

    const rateNum = Number(gstRate);
    if (![0, 5, 12, 18, 28].includes(rateNum)) {
      return res.status(400).json({
        success: false,
        message: 'GST rate must be one of: 0%, 5%, 12%, 18%, or 28%.',
      });
    }

    // Auto-generate code if empty
    let itemCode = code ? code.trim().toUpperCase() : '';
    if (!itemCode) {
      const count = await Product.countDocuments({ user: req.user._id });
      itemCode = `ITEM-${(count + 1).toString().padStart(4, '0')}`;
    }

    const product = await Product.create({
      user: req.user._id,
      name: name.trim(),
      code: itemCode,
      hsnCode: hsnCode ? hsnCode.trim() : '',
      description: description ? description.trim() : '',
      type: type || 'product',
      category: category ? category.trim() : 'General',
      unitPrice: priceNum,
      gstRate: rateNum,
      unit: unit ? unit.trim().toUpperCase() : 'PCS',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Product / Service added successfully.',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const {
      name,
      code,
      hsnCode,
      description,
      type,
      category,
      unitPrice,
      gstRate,
      unit,
      isActive,
    } = req.body;

    if (name) product.name = name.trim();
    if (code !== undefined) product.code = code.trim().toUpperCase();
    if (hsnCode !== undefined) product.hsnCode = hsnCode.trim();
    if (description !== undefined) product.description = description.trim();
    if (type) product.type = type;
    if (category) product.category = category.trim();

    if (unitPrice !== undefined) {
      const priceNum = Number(unitPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Unit price must be a non-negative number.',
        });
      }
      product.unitPrice = priceNum;
    }

    if (gstRate !== undefined) {
      const rateNum = Number(gstRate);
      if (![0, 5, 12, 18, 28].includes(rateNum)) {
        return res.status(400).json({
          success: false,
          message: 'GST rate must be 0, 5, 12, 18, or 28%.',
        });
      }
      product.gstRate = rateNum;
    }

    if (unit) product.unit = unit.trim().toUpperCase();
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product safely
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Safeguard: Check if used in invoices
    const usedInInvoices = await Invoice.countDocuments({
      user: req.user._id,
      'items.product': product._id,
    });

    if (usedInInvoices > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product. It is referenced in ${usedInInvoices} invoice(s). You can mark it as inactive instead to prevent future selections.`,
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
