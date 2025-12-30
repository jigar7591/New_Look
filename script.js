const stripe = Stripe('pk_test_51YourStripePublishableKeyHere'); // Replace with your Stripe publishable key
const elements = stripe.elements();
const card = elements.create('card');
card.mount('#card-element');

let cart = [];
let total = 0;
let products = [];

// Fetch products from backend
fetch('/api/products')
    .then(res => {
        if (!res.ok) {
            throw new Error('Failed to fetch products');
        }
        return res.json();
    })
    .then(data => {
        console.log('Fetched products:', data); // Debug log
        products = data;
        renderProducts();
    })
    .catch(error => {
        console.error('Error fetching products:', error);
        alert('Error loading products. Check console for details.');
    });

function renderProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card h-100">
                <img src="${product.image}" class="card-img-top" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=Image+Not+Found'; console.error('Image failed to load for ${product.name}: ${product.image}');">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">£${product.price}</p>
                    <div class="d-flex align-items-center mb-2">
                        <label for="qty-${product.id}" class="me-2">Qty:</label>
                        <input type="number" id="qty-${product.id}" class="form-control form-control-sm" style="width: 60px;" min="1" max="10" value="1">
                    </div>
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `;
        productList.appendChild(col);
        // Image loading effect
        const img = col.querySelector('.card-img-top');
        img.addEventListener('load', () => img.classList.add('loaded'));
    });

    // Add event listeners
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const qtyInput = document.getElementById(`qty-${id}`);
            const quantity = parseInt(qtyInput.value) || 1;
            if (quantity < 1 || quantity > 10) {
                alert('Please select a quantity between 1 and 10.');
                return;
            }
            const product = products.find(p => p.id == id);
            for (let i = 0; i < quantity; i++) {
                cart.push(product);
                total += product.price;
            }
            updateCart();
            alert(`${quantity} ${product.name}(s) added to cart!`);
        });
    });
}

function updateCart() {
    document.getElementById('cart-count').textContent = cart.length;
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    if (cart.length === 0) {
        cartItems.innerHTML = '<li class="list-group-item empty-cart">Your cart is empty.</li>';
        document.getElementById('total').textContent = '0.00';
        return;
    }
    total = 0;
    const itemCounts = {};
    cart.forEach(item => {
        itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;
    });
    Object.keys(itemCounts).forEach(id => {
        const item = cart.find(i => i.id == id);
        const quantity = itemCounts[id];
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h6>${item.name}</h6>
                <p>£${item.price} x ${quantity}</p>
            </div>
            <button class="remove-item" data-id="${id}">Remove</button>
        `;
        cartItems.appendChild(li);
        total += item.price * quantity;
    });
    document.getElementById('total').textContent = total.toFixed(2);

    // Add remove event listeners
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            cart = cart.filter(item => item.id != id);
            updateCart();
        });
    });
}

document.getElementById('view-cart').addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('cart-modal')).show();
});

document.getElementById('checkout').addEventListener('click', () => {
    document.getElementById('cart-modal').querySelector('.btn-close').click();
    document.getElementById('payment-form').style.display = 'block';
});

document.getElementById('stripe-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: card,
    });
    if (error) {
        alert(error.message);
    } else {
        // Send to backend for processing
        fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethodId: paymentMethod.id, amount: total * 100, cart })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Payment successful!');
                cart = [];
                total = 0;
                updateCart();
                document.getElementById('payment-form').style.display = 'none';
            } else {
                alert('Payment failed: ' + data.error);
            }
        });
    }
});