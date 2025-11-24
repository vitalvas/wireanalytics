# WireAnalytics

Self-hosted web analytics solution built on open-source components.

## Architecture

```
Browser (wa.js) -----> Vector.dev --> VictoriaLogs (events)
                  |               --> VictoriaMetrics (metrics)
Browser (NEL) -----
                                          |
                                      Grafana
```

## Features

- Page views and SPA navigation
- Click tracking and outbound links
- Scroll depth with milestones (25%, 50%, 75%, 100%)
- Core Web Vitals (LCP, FID, CLS, INP, TTFB, FCP)
- Error tracking (JS errors, resource errors, CSP violations)
- Form tracking (start, submit, abandon)
- E-commerce tracking
- A/B testing
- Session replay
- Network status detection
- GeoIP enrichment
- NEL (Network Error Logging)

## Quick Start

```html
<script defer src="https://analytics.example.com/wa.js"></script>
```

### With Options

```html
<script defer src="https://analytics.example.com/wa.js"
        data-wa-endpoint="https://analytics.example.com/api/v1/collect"
        data-wa-site="your-site-id"></script>
```

### Privacy Mode

```html
<script defer src="https://analytics.example.com/wa.js" data-wa-privacy></script>
```

## JavaScript API

```javascript
// Custom events
wa.track('button_click', { button: 'signup' });

// User identification
wa.identify('user_12345');

// A/B testing
const variant = wa.ab.getVariant('test-name', ['control', 'variant-a']);

// Session replay
wa.replay.start();

// E-commerce
wa.ecommerce.purchase({ id: 'ORDER-123', total: 99.99 });
```

## Documentation

- [Technology Stack](docs/technology.md)
- [Feature Comparison](docs/comparison.md)
- [NEL Configuration](docs/nel.md)

## License

MIT
