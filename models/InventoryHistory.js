exports.createInventory = async (req, res) => {
  try {
    const { branch, product, currentStock, minimumStockLevel } = req.body;

    const existing = await Inventory.findOne({
      branch,
      product,
    });

    if (existing) {
      return res.status(400).json({
        message: "This product already exists in this branch inventory",
      });
    }

    const productData = await Product.findById(product);

    const inventory = new Inventory({
      branch,
      product,
      currentStock: Number(currentStock),
      minimumStockLevel:
        Number(minimumStockLevel) || productData?.minimumStockLevel || 0,
    });

    // safer assignment
    if (req.user?._id) {
      inventory.lastUpdatedBy = req.user._id;
    }

    await inventory.save();

    res.status(201).json(inventory);
  } catch (error) {
    console.error("Create inventory error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
