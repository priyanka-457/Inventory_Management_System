document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const totalItemsElement = document.getElementById('total-items');
    const totalValueElement = document.getElementById('total-value');
    const categoriesCountElement = document.getElementById('categories-count');
    const lowStockCountElement = document.getElementById('low-stock-count');
    const lowStockTable = document.getElementById('low-stock-table');
    const lowStockTbody = document.getElementById('low-stock-items');
    const noLowStockElement = document.getElementById('no-low-stock');
    const refreshDataBtn = document.getElementById('refresh-data');
    const updateThresholdBtn = document.getElementById('update-threshold');
    const thresholdInput = document.getElementById('low-stock-threshold');
    const refreshIntervalSelect = document.getElementById('refresh-interval');
    
    // Chart instances
    let categoryChart, topItemsChart;
    
    // State
    let refreshIntervalId = null;
    let currentThreshold = 5;
    
    // Initialize the dashboard
    initDashboard();
    setupEventListeners();
    
    function initDashboard() {
        currentThreshold = parseInt(localStorage.getItem('lowStockThreshold')) || 5;
        thresholdInput.value = currentThreshold;
        
        const savedInterval = localStorage.getItem('refreshInterval') || '30';
        refreshIntervalSelect.value = savedInterval;
        
        if (savedInterval !== '0') {
            startAutoRefresh(parseInt(savedInterval));
        }
        
        loadDashboardData();
    }
    
    function loadDashboardData() {
        // Load all data in parallel
        Promise.all([
            makeRequest('/analytics/category-distribution'),
            makeRequest('/analytics/top-items'),
            makeRequest('/analytics/total-value'),
            makeRequest(`/analytics/low-stock?threshold=${currentThreshold}`),
            makeRequest('/items')
        ])
        .then(([categoryData, topItemsData, totalValueData, lowStockData, allItemsData]) => {
            // Update summary cards
            totalItemsElement.textContent = allItemsData.length;
            totalValueElement.textContent = formatCurrency(totalValueData.totalValue || 0);
            
            // Count unique categories
            const categories = new Set(allItemsData.map(item => item.category));
            categoriesCountElement.textContent = categories.size;
            
            // Low stock count
            lowStockCountElement.textContent = lowStockData.length;
            
            // Render charts
            renderCategoryChart(categoryData);
            renderTopItemsChart(topItemsData);
            
            // Render low stock items
            renderLowStockItems(lowStockData);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        });
    }
    
    function renderCategoryChart(data) {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        const labels = data.map(item => item._id);
        const counts = data.map(item => item.count);
        
        // Generate colors dynamically
        const backgroundColors = generateColors(labels.length);
        
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }
    
    function renderTopItemsChart(data) {
        const ctx = document.getElementById('top-items-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (topItemsChart) {
            topItemsChart.destroy();
        }
        
        const labels = data.map(item => item.name);
        const quantities = data.map(item => item.quantity);
        
        topItemsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quantity',
                    data: quantities,
                    backgroundColor: '#2ecc71',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    function renderLowStockItems(items) {
        lowStockTbody.innerHTML = '';
        
        if (items.length === 0) {
            noLowStockElement.style.display = 'block';
            lowStockTable.style.display = 'none';
            return;
        }
        
        noLowStockElement.style.display = 'none';
        lowStockTable.style.display = 'table';
        
        items.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'low-stock';
            
            row.innerHTML = `
                <td>${item.name}</td>
                <td class="quantity-cell">${item.quantity}</td>
                <td>${item.category}</td>
                <td>${formatCurrency(item.price)}</td>
            `;
            
            lowStockTbody.appendChild(row);
        });
    }
    
    function setupEventListeners() {
        // Refresh data button
        refreshDataBtn.addEventListener('click', loadDashboardData);
        
        // Update threshold button
        updateThresholdBtn.addEventListener('click', () => {
            const newThreshold = parseInt(thresholdInput.value);
            if (isNaN(newThreshold) {
                showNotification('Please enter a valid number', 'error');
                return;
            }
            
            currentThreshold = newThreshold;
            localStorage.setItem('lowStockThreshold', currentThreshold);
            loadDashboardData();
            showNotification('Low stock threshold updated');
        });
        
        // Refresh interval change
        refreshIntervalSelect.addEventListener('change', (e) => {
            const interval = parseInt(e.target.value);
            localStorage.setItem('refreshInterval', interval.toString());
            
            // Clear existing interval
            if (refreshIntervalId) {
                clearInterval(refreshIntervalId);
                refreshIntervalId = null;
            }
            
            // Start new interval if not manual
            if (interval > 0) {
                startAutoRefresh(interval);
                showNotification(`Auto-refresh set to ${interval} seconds`);
            } else {
                showNotification('Auto-refresh disabled');
            }
        });
    }
    
    function startAutoRefresh(intervalSeconds) {
        refreshIntervalId = setInterval(() => {
            loadDashboardData();
        }, intervalSeconds * 1000);
    }
    
    function generateColors(count) {
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = i * hueStep;
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        
        return colors;
    }
    
    // Clean up interval when page is unloaded
    window.addEventListener('beforeunload', () => {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
    });
});