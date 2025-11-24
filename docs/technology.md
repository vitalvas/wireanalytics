# WireAnalytics - Technology Stack

## Overview

WireAnalytics is a self-hosted web analytics solution built on open-source components.

## Architecture

```
Browser (wa.js) -----> Vector.dev --> VictoriaLogs (events)
                  |               --> VictoriaMetrics (metrics)
Browser (NEL) -----
                                          |
                                      Grafana
```

## Components

### Data Collection

- **JavaScript Tracker (wa.js)**: Lightweight tracking script embedded in websites
  - Collects page views, clicks, scroll depth, and more
  - Uses Beacon API for non-blocking data transmission
  - Persistent visitor identification via localStorage + cookie
  - Privacy mode for cookie-less tracking
  - JavaScript API for custom events and e-commerce

- **Network Error Logging (NEL)**: Browser-native network error reporting
  - Captures DNS, TCP, TLS, and HTTP errors
  - Configured via HTTP response headers
  - See [NEL documentation](nel.md) for details

### Data Pipeline

- **Vector.dev**: High-performance data pipeline
  - Receives events via HTTP source
  - GeoIP enrichment (MaxMind)
  - Site whitelist filtering
  - Transforms and routes data to storage backends

### Storage

- **VictoriaLogs**: Log storage for raw events
  - Stores complete event payloads
  - Enables detailed event analysis and debugging

- **VictoriaMetrics**: Time-series metrics storage
  - Stores aggregated metrics (page views, unique visitors, etc.)
  - Optimized for time-series queries and dashboards

### Visualization

- **Grafana**: Dashboard and visualization
  - Pre-built dashboards for common analytics views
  - Custom dashboard creation
  - Alerting capabilities

## Events Tracked

### Automatic Events

| Event | Description |
|-------|-------------|
| `pageview` | Page view (initial and SPA navigation) |
| `click` | Click on links, buttons, tracked elements |
| `outbound` | Click on external links |
| `scroll` | Maximum scroll depth on page leave |
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
| `image_visible` | Tracked images entering viewport |
| `right_click` | Context menu opens |
| `download` | File download clicks |
| `form_start` | First interaction with a form |
| `form_submit` | Form submission |
| `form_abandon` | Unsubmitted form on page leave |
| `scroll_milestone` | Scroll depth milestones (25%, 50%, 75%, 100%) |
| `element_visibility` | Element visibility duration on page leave |
| `online` | Network connection restored |
| `offline` | Network connection lost |
| `network_restored` | Network restored with offline duration |

### API Events

| Event | Description |
|-------|-------------|
| `custom` | Custom events via `wa.track()` |
| `identify` | User identification via `wa.identify()` |
| `ecommerce` | E-commerce events via `wa.ecommerce.*` |
| `ab_test` | A/B test variant assignment via `wa.ab.*` |
| `replay` | Session replay data via `wa.replay.*` |

## Data Collected

### Base Data (All Events)

| Field | Description |
|-------|-------------|
| `site_id` | Website identifier |
| `event` | Event type |
| `timestamp` | ISO 8601 timestamp |
| `visitor_id` | Persistent visitor identifier (null in privacy mode) |
| `session_id` | Session identifier (null in privacy mode) |
| `user_id` | Linked user ID (null if not identified) |
| `ab_tests` | Active A/B test variants (object) |
| `page.url` | Full page URL |
| `page.path` | URL path |
| `page.search` | Query string |
| `page.hash` | URL hash |
| `page.title` | Page title |
| `page.referrer` | Referrer URL |
| `browser.user_agent` | User agent string |
| `browser.language` | Primary language |
| `browser.languages` | All accepted languages |
| `browser.cookies_enabled` | Cookie support |
| `browser.do_not_track` | DNT header value |
| `screen.width` | Screen width |
| `screen.height` | Screen height |
| `screen.pixel_ratio` | Device pixel ratio |
| `screen.viewport_width` | Viewport width |
| `screen.viewport_height` | Viewport height |
| `screen.color_depth` | Color depth |
| `device.type` | Device type (desktop/mobile/tablet) |
| `device.touch` | Touch support |
| `device.memory` | Device memory (GB) |
| `device.cores` | CPU cores |
| `timezone.name` | Timezone name |
| `timezone.offset` | Timezone offset (minutes) |
| `connection.type` | Connection type |
| `connection.downlink` | Downlink speed |
| `connection.rtt` | Round-trip time |
| `utm.source` | UTM source parameter |
| `utm.medium` | UTM medium parameter |
| `utm.campaign` | UTM campaign parameter |
| `utm.term` | UTM term parameter |
| `utm.content` | UTM content parameter |
| `utm.id` | UTM ID parameter |

### Page View Events

| Field | Description |
|-------|-------------|
| `performance.dns` | DNS lookup time (ms) |
| `performance.tcp` | TCP connection time (ms) |
| `performance.ttfb` | Time to first byte (ms) |
| `performance.download` | Download time (ms) |
| `performance.dom_interactive` | DOM interactive time (ms) |
| `performance.dom_complete` | DOM complete time (ms) |
| `performance.load` | Page load time (ms) |
| `spa.navigation` | True if SPA navigation |
| `spa.previous_url` | Previous URL (SPA only) |

### Click Events

| Field | Description |
|-------|-------------|
| `click.tag` | HTML tag name |
| `click.id` | Element ID |
| `click.classes` | Element classes |
| `click.text` | Element text (max 100 chars) |
| `click.href` | Link href |
| `click.x` | Click X coordinate |
| `click.y` | Click Y coordinate |
| `click.track` | Custom tracking attribute |
| `click.external_hostname` | External link hostname (outbound only) |
| `click.external_pathname` | External link path (outbound only) |

### Scroll Events

| Field | Description |
|-------|-------------|
| `scroll.max_depth` | Maximum scroll depth percentage |
| `scroll.milestones_reached` | Array of reached milestones (25, 50, 75, 100) |

### Scroll Milestone Events

| Field | Description |
|-------|-------------|
| `scroll_milestone.milestone` | Milestone percentage reached (25, 50, 75, 100) |
| `scroll_milestone.current_depth` | Current scroll depth when milestone reached |

### Web Vitals Events

| Field | Description | Good | Poor |
|-------|-------------|------|------|
| `web_vitals.lcp` | Largest Contentful Paint (ms) | ≤2500 | >4000 |
| `web_vitals.fid` | First Input Delay (ms) | ≤100 | >300 |
| `web_vitals.cls` | Cumulative Layout Shift | ≤0.1 | >0.25 |
| `web_vitals.inp` | Interaction to Next Paint (ms) | ≤200 | >500 |
| `web_vitals.ttfb` | Time to First Byte (ms) | ≤800 | >1800 |
| `web_vitals.fcp` | First Contentful Paint (ms) | ≤1800 | >3000 |

### Error Events

| Field | Description |
|-------|-------------|
| `error.message` | Error message (max 1000 chars) |
| `error.type` | Error type (TypeError, etc.) |
| `error.source` | Source file URL |
| `error.line` | Line number |
| `error.column` | Column number |
| `error.stack` | Parsed stack trace (array of frames) |

### Resource Error Events

| Field | Description |
|-------|-------------|
| `resource.type` | Resource type (image, script, stylesheet) |
| `resource.url` | Resource URL |
| `resource.tag` | HTML tag name |

### Print Events

No additional fields.

### Copy Events

| Field | Description |
|-------|-------------|
| `copy.text_length` | Length of copied text |
| `copy.text_preview` | First 100 characters |

### Rage Click Events

| Field | Description |
|-------|-------------|
| `rage_click.x` | Click X coordinate |
| `rage_click.y` | Click Y coordinate |
| `rage_click.count` | Number of rapid clicks |
| `rage_click.element.tag` | Target element tag |
| `rage_click.element.id` | Target element ID |
| `rage_click.element.classes` | Target element classes |

### Time on Page Events

| Field | Description |
|-------|-------------|
| `time_on_page.total_ms` | Total time on page (ms) |
| `time_on_page.active_ms` | Active engagement time (ms) |
| `time_on_page.inactive_ms` | Inactive time (ms) |

### Orientation Change Events

| Field | Description |
|-------|-------------|
| `orientation.previous` | Previous orientation |
| `orientation.current` | Current orientation |
| `orientation.angle` | Screen angle |

### Resize Events

| Field | Description |
|-------|-------------|
| `resize.previous_width` | Previous viewport width |
| `resize.previous_height` | Previous viewport height |
| `resize.current_width` | Current viewport width |
| `resize.current_height` | Current viewport height |

### CSP Violation Events

| Field | Description |
|-------|-------------|
| `csp.blocked_uri` | Blocked resource URI |
| `csp.violated_directive` | Violated directive |
| `csp.effective_directive` | Effective directive |
| `csp.original_policy` | Original policy (max 500 chars) |
| `csp.source_file` | Source file |
| `csp.line_number` | Line number |
| `csp.column_number` | Column number |

### Long Task Events

| Field | Description |
|-------|-------------|
| `long_task.duration` | Task duration (ms) |
| `long_task.start_time` | Task start time (ms) |
| `long_task.name` | Task name |
| `long_task.attribution` | Task attribution details |

### Image Visibility Events

| Field | Description |
|-------|-------------|
| `image.src` | Image source URL |
| `image.alt` | Image alt text |
| `image.width` | Image width |
| `image.height` | Image height |

### Right Click Events

| Field | Description |
|-------|-------------|
| `right_click.x` | Click X coordinate |
| `right_click.y` | Click Y coordinate |
| `right_click.element.tag` | Target element tag |
| `right_click.element.id` | Target element ID |
| `right_click.element.classes` | Target element classes |
| `right_click.image_src` | Image source (if image) |
| `right_click.href` | Link href (if link) |

### Download Events

| Field | Description |
|-------|-------------|
| `download.url` | Download URL |
| `download.filename` | File name |
| `download.extension` | File extension |

Supported extensions: pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, 7z, tar, gz, dmg, exe, msi, apk, ipa, csv, txt, rtf, mp3, mp4, avi, mov, wmv, svg, eps, ai, psd

### Form Events

| Field | Description |
|-------|-------------|
| `form.id` | Form ID |
| `form.name` | Form name |
| `form.action` | Form action URL |
| `form.method` | Form method (get/post) |
| `form.time_spent_ms` | Time spent on form (ms) |
| `form.fields_interacted` | Number of fields interacted with |

Events: `form_start`, `form_submit`, `form_abandon`

### Custom Events

| Field | Description |
|-------|-------------|
| `custom.name` | Event name |
| `custom.data` | Custom event data object |

### Identify Events

| Field | Description |
|-------|-------------|
| `identify.user_id` | User ID |

### E-commerce Events

| Field | Description |
|-------|-------------|
| `ecommerce.action` | Action type |
| `ecommerce.product` | Product details |
| `ecommerce.products` | Array of products |
| `ecommerce.quantity` | Quantity |
| `ecommerce.order` | Order details |
| `ecommerce.total` | Total amount |

Actions: `view_product`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase`, `refund`

### A/B Test Events

| Field | Description |
|-------|-------------|
| `ab_test.test_name` | Name of the A/B test |
| `ab_test.variant` | Assigned variant |
| `ab_test.variants` | Array of all possible variants |
| `ab_test.forced` | True if variant was manually set |

### Session Replay Events

| Field | Description |
|-------|-------------|
| `replay.session_id` | Unique replay session identifier |
| `replay.events` | Array of replay events |

Replay event types: `snapshot`, `mouse`, `click`, `scroll`, `input`, `resize`, `dom_add`, `dom_remove`, `dom_attr`

### Element Visibility Events

| Field | Description |
|-------|-------------|
| `element_visibility.selector` | Element selector or custom ID |
| `element_visibility.visible_time_ms` | Total visible time (ms) |
| `element_visibility.first_seen` | ISO 8601 timestamp of first visibility |

### Network Status Events

| Field | Description |
|-------|-------------|
| `network.status` | Network status (online/offline) |
| `network.connection` | Connection info object |
| `network.offline_duration_ms` | Duration offline (ms, network_restored only) |
| `network.total_offline_time_ms` | Total offline time in session (ms) |

## GeoIP Data (Vector Enrichment)

| Field | Description |
|-------|-------------|
| `geo.country_code` | ISO country code |
| `geo.country_name` | Country name |
| `geo.city` | City name |
| `geo.region` | Region/state name |
| `geo.region_code` | Region/state code |
| `geo.postal_code` | Postal/ZIP code |
| `geo.latitude` | Latitude |
| `geo.longitude` | Longitude |
| `geo.timezone` | Timezone |
| `geo.asn` | Autonomous System Number |
| `geo.as_org` | AS Organization name |

## Integration

### Basic Integration

```html
<script defer src="https://analytics.example.com/wa.js"></script>
```

### With Options

```html
<script defer src="https://analytics.example.com/wa.js"
        data-wa-endpoint="https://analytics.example.com/api/v1/collect"
        data-wa-site="your-site-id"></script>
```

### Privacy Mode (Cookie-less)

```html
<script defer src="https://analytics.example.com/wa.js" data-wa-privacy></script>
```

### Cross-Site Tracking (Enabled by Default)

Cross-site tracking is enabled by default to track visitors across subdomains.

The domain is automatically derived from the current hostname (e.g., `www.example.com` becomes `.example.com`).

**Custom domain:**
```html
<script defer src="https://analytics.example.com/wa.js"
        data-wa-cross-site=".example.com"></script>
```

**Disable cross-site tracking:**
```html
<script defer src="https://analytics.example.com/wa.js" data-wa-no-cross-site></script>
```

**Requirements:**
- HTTPS required (uses `SameSite=None; Secure`)
- Same parent domain for subdomains
- Cookie stored in browser (not localStorage)

**Example for multiple subdomains:**
```
www.example.com    --> shared visitor ID
shop.example.com   --> shared visitor ID
blog.example.com   --> shared visitor ID
```

### Script Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-wa-endpoint` | `{script-origin}/api/v1/collect` | Collection endpoint |
| `data-wa-site` | Current hostname | Site identifier |
| `data-wa-privacy` | Not set | Enable privacy mode (no cookies/storage) |
| `data-wa-cross-site` | Auto-derived from hostname | Domain for cross-site cookie (e.g., `.example.com`) |
| `data-wa-no-cross-site` | Not set | Disable cross-site tracking |

### Custom Element Tracking

```html
<button data-wa-track="signup-button">Sign Up</button>
```

### Image Visibility Tracking

```html
<img src="hero.jpg" data-wa-track-visibility>
```

## JavaScript API

### Custom Events

```javascript
// Track custom events
wa.track('button_click', { button: 'signup', variant: 'blue' });
wa.track('video_played', { video_id: '123', duration: 120 });
wa.track('search', { query: 'blue shoes', results: 42 });
```

### User Identification

```javascript
// Link anonymous visitor to logged-in user
wa.identify('user_12345');

// Clear user ID on logout
wa.identify(null);
```

User ID is persisted in localStorage and included in all subsequent events.

### E-commerce Tracking

```javascript
// View product
wa.ecommerce.viewProduct({
  id: 'SKU123',
  name: 'Blue T-Shirt',
  category: 'Clothing',
  price: 29.99,
  currency: 'USD',
  brand: 'Acme',
  variant: 'Large'
});

// Add to cart
wa.ecommerce.addToCart({
  id: 'SKU123',
  name: 'Blue T-Shirt',
  price: 29.99,
  currency: 'USD'
}, 2); // quantity

// Remove from cart
wa.ecommerce.removeFromCart({
  id: 'SKU123',
  name: 'Blue T-Shirt'
}, 1); // quantity

// View cart
wa.ecommerce.viewCart([
  { id: 'SKU123', name: 'Blue T-Shirt', price: 29.99, quantity: 2 },
  { id: 'SKU456', name: 'Red Hat', price: 19.99, quantity: 1 }
], 79.97); // total

// Begin checkout
wa.ecommerce.beginCheckout([
  { id: 'SKU123', name: 'Blue T-Shirt', price: 29.99, quantity: 2 }
], 59.98); // total

// Purchase
wa.ecommerce.purchase({
  id: 'ORDER-789',
  total: 64.98,
  currency: 'USD',
  tax: 5.00,
  shipping: 0,
  discount: 0,
  coupon: 'SAVE10',
  products: [
    { id: 'SKU123', name: 'Blue T-Shirt', price: 29.99, quantity: 2 }
  ]
});

// Refund
wa.ecommerce.refund({
  id: 'ORDER-789',
  total: 29.99,
  products: [
    { id: 'SKU123', quantity: 1 }
  ]
});
```

### A/B Testing

```javascript
// Get variant for A/B test (assigns randomly if not already assigned)
const variant = wa.ab.getVariant('homepage-hero', ['control', 'variant-a', 'variant-b']);

// Get variant with custom weights (60% control, 20% each variant)
const variant = wa.ab.getVariant('pricing-test', ['control', 'new-pricing'], [60, 40]);

// Manually set variant (e.g., for QA testing)
wa.ab.setVariant('homepage-hero', 'variant-a');

// Get all active A/B tests
const tests = wa.ab.getAll();

// Clear specific test assignment
wa.ab.clear('homepage-hero');

// Clear all test assignments
wa.ab.clear();
```

Variants are persisted in localStorage and included in all events via `ab_tests` field.

### Session Replay

```javascript
// Start recording session replay
wa.replay.start();

// Stop recording
wa.replay.stop();

// Check if replay is active
const isActive = wa.replay.isActive();
```

Session replay captures mouse movements, clicks, scrolls, input changes, viewport resizes, and DOM mutations. Password fields are automatically masked.

### Element Visibility Duration

Track how long elements are visible to users:

```html
<!-- Track visibility duration with custom ID -->
<div data-wa-track-duration="hero-section">...</div>

<!-- Track visibility duration (uses element selector) -->
<section data-wa-track-duration>...</section>
```

Visibility data is sent when the user leaves the page.

## Privacy Considerations

- **Standard Mode**: Visitor ID stored in cross-site cookie (enabled by default)
- **Single-Domain Mode**: Use `data-wa-no-cross-site` for single domain only
- **Privacy Mode**: No cookies, no localStorage, anonymous tracking
- Session timeout: 30 minutes
- Cross-site tracking enabled by default (can be disabled)
- Respects Do Not Track header (collected but can be filtered)
- All data stored on your infrastructure
