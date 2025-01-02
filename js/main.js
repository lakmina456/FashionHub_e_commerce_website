// Theme Management
let currentTheme = localStorage.getItem('theme') || 'light';

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    updateTheme();
}

function updateTheme() {
    // Update HTML class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(currentTheme);

    // Update body class
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(currentTheme);

    // Update theme icons
    const moonIcon = document.querySelector('.fa-moon');
    const sunIcon = document.querySelector('.fa-sun');
    if (moonIcon && sunIcon) {
        if (currentTheme === 'dark') {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    }

    // Update background colors
    if (currentTheme === 'dark') {
        document.body.classList.add('bg-gray-900', 'text-white');
        document.body.classList.remove('bg-gray-50', 'text-gray-900');
    } else {
        document.body.classList.remove('bg-gray-900', 'text-white');
        document.body.classList.add('bg-gray-50', 'text-gray-900');
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    // Apply theme immediately
    updateTheme();
    
    // Add transition after initial load to prevent flash
    setTimeout(() => {
        document.body.classList.add('transition-colors', 'duration-200');
    }, 100);

    // Rest of the initialization code
    updateAuthUI();
    updateCart();
    
    if (window.location.pathname.includes('shop.html')) {
        initializeProducts();
        initializeFilters();
        displayProducts();
    }
});

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

function addToCart(productId, name, price, image) {
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId, name, price, image, quantity: 1 });
    }
    updateCart();
    showNotification('Product added to cart');
}

// Authentication
let currentUser = JSON.parse(localStorage.getItem('user'));
let token = localStorage.getItem('token');

function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        if (currentUser) {
            authSection.innerHTML = `
                <span class="text-gray-600 dark:text-gray-300">Welcome, ${currentUser.name}</span>
                <button onclick="logout()" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white ml-4">Logout</button>
            `;
        } else {
            authSection.innerHTML = `
                <a href="login.html" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Login</a>
                <a href="register.html" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white ml-4">Register</a>
            `;
        }
    }
}

async function login(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            token = data.token;
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            updateAuthUI();
            window.location.href = 'index.html';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function register(name, email, password, address) {
    try {
        const response = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, address })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            token = data.token;
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            updateAuthUI();
            window.location.href = 'index.html';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function logout() {
    currentUser = null;
    token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    updateAuthUI();
    window.location.href = 'index.html';
}

// Products
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const products = await response.json();
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.innerHTML = products.map(product => `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${product.name}</h3>
                        <p class="text-gray-600 dark:text-gray-300 mt-2">$${product.price}</p>
                        <button onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.image}')" 
                                class="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        showNotification('Error loading products', 'error');
    }
}

// Notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Filter and Sort Functionality
let allProducts = [];
let filteredProducts = [];

// Initialize filters
const filters = {
    categories: new Set(),
    priceRange: {
        min: 0,
        max: 1000
    },
    sortBy: 'default',
    searchQuery: ''
};

// Filter functions
function initializeFilters() {
    // Search functionality
    const searchInput = document.querySelector('input[type="text"][placeholder="Search products..."]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filters.searchQuery = e.target.value.toLowerCase().trim();
            applyFilters();
        });
    }

    // Category checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const category = e.target.nextElementSibling.textContent.trim();
            if (e.target.checked) {
                filters.categories.add(category);
            } else {
                filters.categories.delete(category);
            }
            applyFilters();
        });
    });

    // Price range
    const priceRange = document.querySelector('input[type="range"]');
    if (priceRange) {
        // Set initial value
        priceRange.value = filters.priceRange.max;
        
        // Add event listeners
        priceRange.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            filters.priceRange.max = value;
            // Update price display
            const priceDisplay = document.querySelector('.price-display');
            if (priceDisplay) {
                priceDisplay.textContent = `$${value}`;
            }
            applyFilters();
        });

        // Initialize price display
        const priceDisplay = document.querySelector('.price-display');
        if (priceDisplay) {
            priceDisplay.textContent = `$${filters.priceRange.max}`;
        }
    }

    // Sort dropdown
    const sortSelect = document.querySelector('select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            filters.sortBy = e.target.value;
            applyFilters();
        });
    }

    // Apply initial filters
    applyFilters();
}

function applyFilters() {
    // Start with all products
    filteredProducts = [...allProducts];

    // Apply search filter
    if (filters.searchQuery) {
        filteredProducts = filteredProducts.filter(product => {
            return (
                product.name.toLowerCase().includes(filters.searchQuery) ||
                product.description.toLowerCase().includes(filters.searchQuery) ||
                getProductCategory(product).toLowerCase().includes(filters.searchQuery)
            );
        });
    }

    // Apply category filter
    if (filters.categories.size > 0) {
        filteredProducts = filteredProducts.filter(product => {
            const productCategory = getProductCategory(product);
            return filters.categories.has(productCategory);
        });
    }

    // Apply price filter
    filteredProducts = filteredProducts.filter(product => {
        const price = parseFloat(product.price);
        return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Apply sorting
    sortProducts();

    // Update display
    displayProducts();

    // Update results count
    updateResultsCount();
}

function getProductCategory(product) {
    const name = product.name.toLowerCase();
    if (name.includes('dress')) return "Women's Fashion";
    if (name.includes('jacket') || name.includes('blazer')) return "Men's Fashion";
    if (name.includes('bag') || name.includes('watch') || name.includes('hat')) return "Accessories";
    if (name.includes('shoes') || name.includes('sneakers')) return "Shoes";
    return "Accessories"; // Default category
}

function sortProducts() {
    switch (filters.sortBy) {
        case 'Price: Low to High':
            filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
        case 'Price: High to Low':
            filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
        case 'Newest First':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'Popular':
            // Sort by tag priority: New > Trending > Limited > Sale
            filteredProducts.sort((a, b) => {
                const tagPriority = { 'New': 4, 'Trending': 3, 'Limited': 2, 'Sale': 1 };
                const priorityA = a.tag ? tagPriority[a.tag] || 0 : 0;
                const priorityB = b.tag ? tagPriority[b.tag] || 0 : 0;
                return priorityB - priorityA;
            });
            break;
        default:
            // Default sorting (by ID)
            filteredProducts.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    }
}

function displayProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    productsContainer.innerHTML = filteredProducts.map(product => `
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden group">
            <div class="relative h-64 overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                ${product.tag ? `<div class="absolute top-2 right-2 ${getTagClass(product.tag)} text-white px-2 py-1 rounded-md text-sm">${product.tag}</div>` : ''}
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${product.name}</h3>
                <p class="text-gray-600 dark:text-gray-300 mt-1">${product.description}</p>
                <div class="flex items-center justify-between mt-3">
                    <span class="text-lg font-bold text-gray-900 dark:text-white">$${product.price}</span>
                    <button onclick="addToCart('${product.id}', '${product.name}', ${product.price}, '${product.image}')" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getTagClass(tag) {
    switch (tag) {
        case 'New': return 'bg-blue-600';
        case 'Sale': return 'bg-red-600';
        case 'Trending': return 'bg-green-600';
        case 'Limited': return 'bg-purple-600';
        default: return 'bg-gray-600';
    }
}

// Initialize products data
function initializeProducts() {
    allProducts = [
        {
            id: '1',
            name: 'Designer Dress',
            description: 'Elegant evening wear',
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105',
            tag: 'New',
            createdAt: '2024-01-10'
        },
        {
            id: '2',
            name: 'Leather Jacket',
            description: 'Classic style',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22',
            tag: 'Sale',
            createdAt: '2024-01-09'
        },
        {
            id: '3',
            name: 'Designer Bag',
            description: 'Luxury accessory',
            price: 399.99,
            image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2',
            createdAt: '2024-01-08'
        },
        {
            id: '4',
            name: 'Designer Shoes',
            description: 'Premium footwear',
            price: 259.99,
            image: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637',
            createdAt: '2024-01-07'
        },
        {
            id: '5',
            name: 'Floral Summer Dress',
            description: 'Light and elegant summer wear',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b',
            tag: 'New',
            createdAt: '2024-01-06'
        },
        {
            id: '6',
            name: 'Classic Denim Jacket',
            description: 'Timeless style statement',
            price: 129.99,
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea',
            tag: 'Sale',
            createdAt: '2024-01-05'
        },
        {
            id: '7',
            name: 'Wide Brim Sun Hat',
            description: 'Perfect summer accessory',
            price: 34.99,
            image: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6',
            createdAt: '2024-01-04'
        },
        {
            id: '8',
            name: 'Urban Sneakers',
            description: 'Comfortable and stylish',
            price: 79.99,
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
            createdAt: '2024-01-03'
        },
        {
            id: '9',
            name: 'Minimalist Watch',
            description: 'Elegant timepiece',
            price: 149.99,
            image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3',
            createdAt: '2024-01-02'
        },
        {
            id: '10',
            name: 'Leather Tote Bag',
            description: 'Spacious and elegant',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1614251056216-f748f76cd228',
            tag: 'Trending',
            createdAt: '2024-01-01'
        },
        {
            id: '11',
            name: 'Classic Blazer',
            description: 'Professional elegance',
            price: 249.99,
            image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8',
            createdAt: '2023-12-31'
        },
        {
            id: '12',
            name: 'Boho Maxi Dress',
            description: 'Bohemian chic style',
            price: 119.99,
            image: 'https://images.unsplash.com/photo-1617952236317-0bd127407984',
            tag: 'Limited',
            createdAt: '2023-12-30'
        },
        {
            id: '13',
            name: 'Sport Sneakers',
            description: 'Athletic performance',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
            tag: 'Sale',
            createdAt: '2023-12-29'
        }
    ];
    filteredProducts = [...allProducts];
}

// Add function to update results count
function updateResultsCount() {
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        // Create or update results count element
        let resultsCount = document.getElementById('results-count');
        if (!resultsCount) {
            resultsCount = document.createElement('div');
            resultsCount.id = 'results-count';
            resultsCount.className = 'text-gray-600 dark:text-gray-300 mb-4';
            productsContainer.parentNode.insertBefore(resultsCount, productsContainer);
        }
        
        // Update the count text
        const count = filteredProducts.length;
        const searchText = filters.searchQuery ? ` for "${filters.searchQuery}"` : '';
        resultsCount.textContent = `${count} product${count !== 1 ? 's' : ''} found${searchText}`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateTheme();
    updateAuthUI();
    updateCart();
    
    // Initialize filters and products on shop page
    if (window.location.pathname.includes('shop.html')) {
        initializeProducts();
        initializeFilters();
        displayProducts();
    }
}); 