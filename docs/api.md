# WireAnalytics JavaScript API

## Installation

```html
<script defer src="https://analytics.example.com/wa.js"></script>
```

### Script Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-wa-endpoint` | `{script-origin}/api/v1/collect` | Collection endpoint URL |
| `data-wa-site` | Current hostname | Site identifier |
| `data-wa-privacy` | Not set | Enable privacy mode (no cookies/storage) |
| `data-wa-cross-site` | Auto-derived from hostname | Domain for cross-site cookie |
| `data-wa-no-cross-site` | Not set | Disable cross-site tracking |

## Global Object

All API methods are available via the global `wa` object.

```javascript
window.wa
```

## Custom Events

### wa.track(eventName, eventData)

Track custom events with optional data.

**Parameters:**
- `eventName` (string, required) - Name of the event
- `eventData` (object, optional) - Custom data to include

**Returns:** void

**Example:**
```javascript
// Simple event
wa.track('button_click');

// Event with data
wa.track('button_click', { button: 'signup', variant: 'blue' });

// Video tracking
wa.track('video_played', {
  video_id: '123',
  duration: 120,
  title: 'Product Demo'
});

// Search tracking
wa.track('search', {
  query: 'blue shoes',
  results: 42,
  filters: ['size:10', 'color:blue']
});
```

## User Identification

### wa.identify(userId)

Link anonymous visitor to a logged-in user ID.

**Parameters:**
- `userId` (string|null) - User ID to link, or null to clear

**Returns:** void

**Notes:**
- User ID is persisted in localStorage
- Included in all subsequent events
- Disabled in privacy mode

**Example:**
```javascript
// After user login
wa.identify('user_12345');

// After logout
wa.identify(null);
```

## A/B Testing

### wa.ab.getVariant(testName, variants, weights)

Get or assign a variant for an A/B test.

**Parameters:**
- `testName` (string, required) - Unique test identifier
- `variants` (array, required) - Array of variant names (min 2)
- `weights` (array, optional) - Array of weights for each variant

**Returns:** string - The assigned variant

**Notes:**
- Variants are assigned randomly on first call
- Assignment is persisted in localStorage
- Same variant returned on subsequent calls
- Weights default to equal distribution

**Example:**
```javascript
// Simple A/B test (50/50 split)
const variant = wa.ab.getVariant('homepage-hero', ['control', 'new-design']);

if (variant === 'new-design') {
  showNewHero();
}

// Multi-variant test
const variant = wa.ab.getVariant('pricing-page', ['control', 'variant-a', 'variant-b']);

// Weighted distribution (70% control, 30% variant)
const variant = wa.ab.getVariant('checkout-flow', ['control', 'new-flow'], [70, 30]);

// Complex weights (50% A, 30% B, 20% C)
const variant = wa.ab.getVariant('button-color', ['red', 'blue', 'green'], [50, 30, 20]);
```

### wa.ab.setVariant(testName, variant)

Manually set a variant (useful for QA testing).

**Parameters:**
- `testName` (string, required) - Test identifier
- `variant` (string, required) - Variant to set

**Returns:** void

**Example:**
```javascript
// Force specific variant for testing
wa.ab.setVariant('homepage-hero', 'new-design');

// URL parameter based override
const urlParams = new URLSearchParams(window.location.search);
const forceVariant = urlParams.get('ab_variant');
if (forceVariant) {
  wa.ab.setVariant('homepage-hero', forceVariant);
}
```

### wa.ab.getAll()

Get all active A/B test assignments.

**Parameters:** none

**Returns:** object - Key-value pairs of test names and variants

**Example:**
```javascript
const tests = wa.ab.getAll();
// { 'homepage-hero': 'new-design', 'pricing-page': 'variant-a' }

// Send to analytics
console.log('Active tests:', tests);
```

### wa.ab.clear(testName)

Clear A/B test assignments.

**Parameters:**
- `testName` (string, optional) - Specific test to clear, or omit to clear all

**Returns:** void

**Example:**
```javascript
// Clear specific test
wa.ab.clear('homepage-hero');

// Clear all tests
wa.ab.clear();
```

## Session Replay

### wa.replay.start()

Start recording session replay data.

**Parameters:** none

**Returns:** void

**Notes:**
- Captures mouse movements, clicks, scrolls, inputs, resizes, DOM mutations
- Password fields are automatically masked
- Data is buffered and sent every 5 seconds or 50 events
- Not started automatically - must be called explicitly

**Example:**
```javascript
// Start replay on page load
wa.replay.start();

// Start replay for specific users
if (user.isPremium) {
  wa.replay.start();
}

// Start replay based on A/B test
if (wa.ab.getVariant('replay-test', ['off', 'on']) === 'on') {
  wa.replay.start();
}
```

### wa.replay.stop()

Stop recording session replay.

**Parameters:** none

**Returns:** void

**Example:**
```javascript
// Stop on sensitive pages
if (window.location.pathname.includes('/payment')) {
  wa.replay.stop();
}
```

### wa.replay.isActive()

Check if session replay is currently recording.

**Parameters:** none

**Returns:** boolean

**Example:**
```javascript
if (!wa.replay.isActive()) {
  wa.replay.start();
}
```

## E-commerce

### wa.ecommerce.viewProduct(product)

Track product view.

**Parameters:**
- `product` (object, required)
  - `id` (string, required) - Product ID/SKU
  - `name` (string, required) - Product name
  - `category` (string, optional) - Product category
  - `price` (number, optional) - Product price
  - `currency` (string, optional) - Currency code (e.g., 'USD')
  - `brand` (string, optional) - Brand name
  - `variant` (string, optional) - Product variant

**Returns:** void

**Example:**
```javascript
wa.ecommerce.viewProduct({
  id: 'SKU123',
  name: 'Blue T-Shirt',
  category: 'Clothing/Shirts',
  price: 29.99,
  currency: 'USD',
  brand: 'Acme',
  variant: 'Large'
});
```

### wa.ecommerce.addToCart(product, quantity)

Track add to cart action.

**Parameters:**
- `product` (object, required) - Same as viewProduct
- `quantity` (number, optional) - Quantity added (default: 1)

**Returns:** void

**Example:**
```javascript
wa.ecommerce.addToCart({
  id: 'SKU123',
  name: 'Blue T-Shirt',
  price: 29.99,
  currency: 'USD'
}, 2);
```

### wa.ecommerce.removeFromCart(product, quantity)

Track remove from cart action.

**Parameters:**
- `product` (object, required)
  - `id` (string, required)
  - `name` (string, required)
  - `category` (string, optional)
  - `price` (number, optional)
  - `currency` (string, optional)
- `quantity` (number, optional) - Quantity removed (default: 1)

**Returns:** void

**Example:**
```javascript
wa.ecommerce.removeFromCart({
  id: 'SKU123',
  name: 'Blue T-Shirt'
}, 1);
```

### wa.ecommerce.viewCart(products, total)

Track cart view.

**Parameters:**
- `products` (array, required) - Array of products in cart
  - `id` (string, required)
  - `name` (string, required)
  - `price` (number, optional)
  - `quantity` (number, optional)
- `total` (number, optional) - Cart total

**Returns:** void

**Example:**
```javascript
wa.ecommerce.viewCart([
  { id: 'SKU123', name: 'Blue T-Shirt', price: 29.99, quantity: 2 },
  { id: 'SKU456', name: 'Red Hat', price: 19.99, quantity: 1 }
], 79.97);
```

### wa.ecommerce.beginCheckout(products, total)

Track checkout initiation.

**Parameters:**
- `products` (array, required) - Array of products
- `total` (number, optional) - Checkout total

**Returns:** void

**Example:**
```javascript
wa.ecommerce.beginCheckout([
  { id: 'SKU123', name: 'Blue T-Shirt', price: 29.99, quantity: 2 }
], 59.98);
```

### wa.ecommerce.purchase(order)

Track completed purchase.

**Parameters:**
- `order` (object, required)
  - `id` (string, required) - Order ID
  - `total` (number, required) - Order total
  - `currency` (string, optional) - Currency code
  - `tax` (number, optional) - Tax amount
  - `shipping` (number, optional) - Shipping cost
  - `discount` (number, optional) - Discount amount
  - `coupon` (string, optional) - Coupon code used
  - `products` (array, optional) - Array of products

**Returns:** void

**Example:**
```javascript
wa.ecommerce.purchase({
  id: 'ORDER-789',
  total: 64.98,
  currency: 'USD',
  tax: 5.00,
  shipping: 0,
  discount: 10.00,
  coupon: 'SAVE10',
  products: [
    { id: 'SKU123', name: 'Blue T-Shirt', price: 29.99, quantity: 2 }
  ]
});
```

### wa.ecommerce.refund(order)

Track refund.

**Parameters:**
- `order` (object, required)
  - `id` (string, required) - Order ID
  - `total` (number, optional) - Refund amount
  - `products` (array, optional) - Products refunded

**Returns:** void

**Example:**
```javascript
// Full refund
wa.ecommerce.refund({
  id: 'ORDER-789',
  total: 64.98
});

// Partial refund
wa.ecommerce.refund({
  id: 'ORDER-789',
  total: 29.99,
  products: [
    { id: 'SKU123', quantity: 1 }
  ]
});
```

## HTML Data Attributes

### Click Tracking

Track clicks on any element with custom identifier.

```html
<button data-wa-track="signup-button">Sign Up</button>
<a href="/pricing" data-wa-track="pricing-link">View Pricing</a>
```

### Image Visibility

Track when images enter the viewport.

```html
<img src="hero.jpg" data-wa-track-visibility alt="Hero Image">
<img src="product.jpg" data-wa-track-visibility alt="Product">
```

### Element Visibility Duration

Track how long elements are visible.

```html
<!-- With custom identifier -->
<div data-wa-track-duration="hero-section">
  Hero content
</div>

<!-- Without identifier (uses element selector) -->
<section data-wa-track-duration>
  Important content
</section>

<!-- Track specific components -->
<article data-wa-track-duration="article-main">
  Article content
</article>
```

## Automatic Tracking

The following events are tracked automatically without any code:

| Event | Description |
|-------|-------------|
| `pageview` | Page loads and SPA navigations |
| `click` | Clicks on links, buttons, tracked elements |
| `outbound` | Clicks on external links |
| `scroll` | Maximum scroll depth on page leave |
| `scroll_milestone` | Scroll milestones (25%, 50%, 75%, 100%) |
| `webvitals` | Core Web Vitals metrics |
| `error` | JavaScript errors |
| `resource_error` | Failed images, scripts, stylesheets |
| `print` | Page print events |
| `copy` | Text copy to clipboard |
| `rage_click` | Frustrated rapid clicking |
| `time_on_page` | Active and total time on page |
| `orientation_change` | Device orientation changes |
| `resize` | Viewport resize events |
| `csp_violation` | Content Security Policy violations |
| `long_task` | JavaScript tasks >50ms |
| `right_click` | Context menu opens |
| `download` | File download clicks |
| `form_start` | First interaction with a form |
| `form_submit` | Form submission |
| `form_abandon` | Unsubmitted form on page leave |
| `online` | Network connection restored |
| `offline` | Network connection lost |
| `element_visibility` | Tracked element visibility duration |

## Privacy Mode

Enable privacy mode to disable all persistent storage:

```html
<script defer src="https://analytics.example.com/wa.js" data-wa-privacy></script>
```

In privacy mode:
- No cookies are set
- No localStorage is used
- `visitor_id` and `session_id` are null
- A/B tests are not persisted
- User identification is disabled

## Cross-Site Tracking

Cross-site tracking is enabled by default for subdomain tracking.

```html
<!-- Custom domain -->
<script defer src="https://analytics.example.com/wa.js"
        data-wa-cross-site=".example.com"></script>

<!-- Disable cross-site tracking -->
<script defer src="https://analytics.example.com/wa.js"
        data-wa-no-cross-site></script>
```

