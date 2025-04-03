const Item = require('../models/Item');

exports.getCategoryDistribution = async (req, res) => {
    try {
        const distribution = await Item.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.json(distribution);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTopItems = async (req, res) => {
    try {
        const topItems = await Item.find().sort({ quantity: -1 }).limit(3);
        res.json(topItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTotalValue = async (req, res) => {
    try {
        const result = await Item.aggregate([
            { 
                $group: { 
                    _id: null, 
                    totalValue: { $sum: { $multiply: ["$price", "$quantity"] } } 
                } 
            }
        ]);
        res.json({ totalValue: result[0]?.totalValue || 0 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getLowStockItems = async (req, res) => {
    try {
        const threshold = req.query.threshold || 5;
        const lowStockItems = await Item.find({ quantity: { $lt: Number(threshold) } });
        res.json(lowStockItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};