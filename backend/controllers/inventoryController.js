const Item = require('../models/Item');

exports.getAllItems = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, minQty, maxQty, sortBy } = req.query;
        let query = {};
        
        if (category) query.category = category;
        if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
        if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
        if (minQty) query.quantity = { ...query.quantity, $gte: Number(minQty) };
        if (maxQty) query.quantity = { ...query.quantity, $lte: Number(maxQty) };
        
        let sortOption = {};
        if (sortBy) {
            const [field, order] = sortBy.split('_');
            sortOption[field] = order === 'desc' ? -1 : 1;
        }
        
        const items = await Item.find(query).sort(sortOption);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createItem = async (req, res) => {
    const item = new Item({
        name: req.body.name,
        quantity: req.body.quantity,
        category: req.body.category,
        price: req.body.price
    });

    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (req.body.name != null) item.name = req.body.name;
        if (req.body.quantity != null) item.quantity = req.body.quantity;
        if (req.body.category != null) item.category = req.body.category;
        if (req.body.price != null) item.price = req.body.price;

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        await item.remove();
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};