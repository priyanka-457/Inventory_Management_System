const express = require('express');
const router = express.Router();
// This should be the correct relative path
const inventoryController = require('../controllers/inventoryController');

// CRUD operations
router.get('/', inventoryController.getAllItems);
router.post('/', inventoryController.createItem);
router.get('/:id', inventoryController.getItem);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

module.exports = router;