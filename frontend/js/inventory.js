document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const inventoryTable = document.getElementById('inventory-table');
    const inventoryTbody = document.getElementById('inventory-items');
    const loadingElement = document.getElementById('loading');
    const noItemsElement = document.getElementById('no-items');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemForm = document.getElementById('item-form');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const exportCsvBtn = document.getElementById('export-csv');
    const bulkDeleteBtn = document.getElementById('bulk-delete');
    const selectAllCheckbox = document.getElementById('select-all');
    const globalSearchInput = document.getElementById('global-search');
    const searchBtn = document.getElementById('search-btn');
    
    // Modal initialization
    const itemModal = initModal('item-modal');
    const deleteModal = initModal('delete-modal');
    
    // State
    let currentItems = [];
    let sortColumn = 'name';
    let sortDirection = 'asc';
    let selectedItemId = null;
    
    // Initialize the page
    loadInventory();
    setupEventListeners();
    
    function loadInventory() {
        showLoading(true);
        
        // Get filter values
        const category = document.getElementById('category-filter').value;
        const minPrice = document.getElementById('min-price').value;
        const maxPrice = document.getElementById('max-price').value;
        const minQty = document.getElementById('min-qty').value;
        const maxQty = document.getElementById('max-qty').value;
        const searchQuery = globalSearchInput.value;
        
        // Build query params
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (minQty) params.append('minQty', minQty);
        if (maxQty) params.append('maxQty', maxQty);
        if (searchQuery) params.append('search', searchQuery);
        params.append('sortBy', `${sortColumn}_${sortDirection}`);
        
        makeRequest(`/items?${params.toString()}`)
            .then(data => {
                currentItems = data;
                renderInventoryTable();
                showLoading(false);
            })
            .catch(error => {
                showNotification(error.message, 'error');
                showLoading(false);
            });
    }
    
    function renderInventoryTable() {
        inventoryTbody.innerHTML = '';
        
        if (currentItems.length === 0) {
            noItemsElement.style.display = 'block';
            return;
        }
        
        noItemsElement.style.display = 'none';
        
        currentItems.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.id = item._id;
            
            row.innerHTML = `
                <td><input type="checkbox" class="item-checkbox" data-id="${item._id}"></td>
                <td>${item.name}</td>
                <td>
                    <button class="qty-btn minus" data-id="${item._id}">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item._id}">+</button>
                </td>
                <td>${item.category}</td>
                <td>${formatCurrency(item.price)}</td>
                <td class="actions">
                    <button class="action-btn edit-btn" data-id="${item._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${item._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            inventoryTbody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                editItem(itemId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                confirmDelete(itemId);
            });
        });
        
        // Quantity adjustment buttons
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                const isPlus = e.currentTarget.classList.contains('plus');
                adjustQuantity(itemId, isPlus);
            });
        });
    }
    
    function showLoading(show) {
        loadingElement.style.display = show ? 'block' : 'none';
        inventoryTable.style.display = show ? 'none' : 'table';
    }
    
    function setupEventListeners() {
        // Add item button
        addItemBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Add New Item';
            document.getElementById('item-id').value = '';
            itemForm.reset();
            clearErrors();
            itemModal.open();
        });
        
        // Form submission
        itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveItem();
        });
        
        // Cancel button in form
        document.getElementById('cancel-btn').addEventListener('click', () => {
            itemModal.close();
        });
        
        // Apply filters button
        applyFiltersBtn.addEventListener('click', loadInventory);
        
        // Reset filters button
        resetFiltersBtn.addEventListener('click', () => {
            document.getElementById('category-filter').value = '';
            document.getElementById('min-price').value = '';
            document.getElementById('max-price').value = '';
            document.getElementById('min-qty').value = '';
            document.getElementById('max-qty').value = '';
            globalSearchInput.value = '';
            loadInventory();
        });
        
        // Export CSV button
        exportCsvBtn.addEventListener('click', exportInventoryToCSV);
        
        // Bulk delete button
        bulkDeleteBtn.addEventListener('click', bulkDeleteItems);
        
        // Select all checkbox
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.item-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
        
        // Table header sorting
        document.querySelectorAll('#inventory-table th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                
                if (sortColumn === column) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = column;
                    sortDirection = 'asc';
                }
                
                // Update sort indicators
                document.querySelectorAll('#inventory-table th i').forEach(icon => {
                    icon.className = 'fas fa-sort';
                });
                
                const sortIcon = header.querySelector('i');
                if (sortIcon) {
                    sortIcon.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`;
                }
                
                loadInventory();
            });
        });
        
        // Global search
        searchBtn.addEventListener('click', loadInventory);
        globalSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                loadInventory();
            }
        });
        
        // Debounced search for better performance
        globalSearchInput.addEventListener('input', debounce(loadInventory, 300));
        
        // Delete modal buttons
        document.getElementById('cancel-delete').addEventListener('click', () => {
            deleteModal.close();
            selectedItemId = null;
        });
        
        document.getElementById('confirm-delete').addEventListener('click', deleteSelectedItem);
    }
    
    function editItem(itemId) {
        const item = currentItems.find(item => item._id === itemId);
        if (!item) return;
        
        document.getElementById('modal-title').textContent = 'Edit Item';
        document.getElementById('item-id').value = item._id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-quantity').value = item.quantity;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-price').value = item.price;
        
        clearErrors();
        itemModal.open();
    }
    
    function saveItem() {
        const itemId = document.getElementById('item-id').value;
        const name = document.getElementById('item-name').value.trim();
        const quantity = document.getElementById('item-quantity').value;
        const category = document.getElementById('item-category').value;
        const price = document.getElementById('item-price').value;
        
        // Validate form
        let isValid = true;
        clearErrors();
        
        if (!name) {
            document.getElementById('name-error').textContent = 'Name is required';
            document.getElementById('name-error').style.display = 'block';
            isValid = false;
        }
        
        if (!quantity || quantity < 0) {
            document.getElementById('quantity-error').textContent = 'Valid quantity is required';
            document.getElementById('quantity-error').style.display = 'block';
            isValid = false;
        }
        
        if (!category) {
            document.getElementById('category-error').textContent = 'Category is required';
            document.getElementById('category-error').style.display = 'block';
            isValid = false;
        }
        
        if (!price || price < 0) {
            document.getElementById('price-error').textContent = 'Valid price is required';
            document.getElementById('price-error').style.display = 'block';
            isValid = false;
        }
        
        if (!isValid) return;
        
        const itemData = {
            name,
            quantity: Number(quantity),
            category,
            price: Number(price)
        };
        
        const request = itemId 
            ? makeRequest(`/items/${itemId}`, 'PUT', itemData)
            : makeRequest('/items', 'POST', itemData);
        
        request.then(() => {
            showNotification(`Item ${itemId ? 'updated' : 'added'} successfully`);
            itemModal.close();
            loadInventory();
        })
        .catch(error => {
            showNotification(error.message, 'error');
        });
    }
    
    function confirmDelete(itemId) {
        selectedItemId = itemId;
        deleteModal.open();
    }
    
    function deleteSelectedItem() {
        if (!selectedItemId) return;
        
        makeRequest(`/items/${selectedItemId}`, 'DELETE')
            .then(() => {
                showNotification('Item deleted successfully');
                deleteModal.close();
                loadInventory();
                selectedItemId = null;
            })
            .catch(error => {
                showNotification(error.message, 'error');
                deleteModal.close();
                selectedItemId = null;
            });
    }
    
    function adjustQuantity(itemId, isIncrease) {
        const item = currentItems.find(item => item._id === itemId);
        if (!item) return;
        
        let newQuantity = isIncrease ? item.quantity + 1 : item.quantity - 1;
        if (newQuantity < 0) newQuantity = 0;
        
        makeRequest(`/items/${itemId}`, 'PUT', { quantity: newQuantity })
            .then(() => {
                loadInventory();
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
    
    function exportInventoryToCSV() {
        if (currentItems.length === 0) {
            showNotification('No items to export', 'error');
            return;
        }
        
        // Prepare data for export
        const exportData = currentItems.map(item => ({
            Name: item.name,
            Quantity: item.quantity,
            Category: item.category,
            Price: item.price,
            'Total Value': item.price * item.quantity
        }));
        
        exportToCSV(exportData, 'inventory_export.csv');
        showNotification('Inventory exported to CSV');
    }
    
    function bulkDeleteItems() {
        const selectedCheckboxes = document.querySelectorAll('.item-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            showNotification('No items selected', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${selectedCheckboxes.length} selected items?`)) {
            return;
        }
        
        const deletePromises = Array.from(selectedCheckboxes).map(checkbox => {
            const itemId = checkbox.dataset.id;
            return makeRequest(`/items/${itemId}`, 'DELETE');
        });
        
        Promise.all(deletePromises)
            .then(() => {
                showNotification(`${selectedCheckboxes.length} items deleted successfully`);
                loadInventory();
                selectAllCheckbox.checked = false;
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
    
    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }
});