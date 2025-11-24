# Web Analytics Comparison

## Feature Comparison

| Feature | WireAnalytics | Google Analytics | Cloudflare Web Analytics | Plausible | Matomo |
|---------|---------------|------------------|--------------------------|-----------|--------|
| Self-hosted | Yes | No | No | Yes | Yes |
| Open source | Yes | No | No | Yes | Yes |
| Privacy-focused | Configurable | No | Yes | Yes | Configurable |
| Cookie-free option | Yes | No | Yes | Yes | Yes |
| Real-time data | Yes | Yes | No | Yes | Yes |
| Page views | Yes | Yes | Yes | Yes | Yes |
| SPA support | Yes | Yes | Yes | Yes | Yes |
| Click tracking | Yes | Yes | No | No | Yes |
| Outbound links | Yes | Yes | No | Yes | Yes |
| Scroll depth | Yes | Yes | No | No | Plugin |
| Core Web Vitals | Yes (6 metrics) | Yes | Yes (3 metrics) | No | Plugin |
| Performance metrics | Yes | Yes | Yes | No | Plugin |
| Custom events | Yes | Yes | No | Yes | Yes |
| User identification | Yes | Yes | No | No | Yes |
| Form tracking | Yes | Yes | No | No | Plugin |
| File downloads | Yes | Yes | No | Yes | Yes |
| E-commerce tracking | Yes | Yes | No | No | Yes |
| Session tracking | Yes | Yes | No | No | Yes |
| Visitor identification | Yes | Yes | No | No | Yes |
| Referrer tracking | Yes | Yes | Yes | Yes | Yes |
| UTM parameters | Yes | Yes | Yes | Yes | Yes |
| Device detection | Yes | Yes | Yes | Yes | Yes |
| Geographic data | Yes (GeoIP) | Yes | Yes | Yes | Yes |
| Error tracking | Yes | No | No | No | Plugin |
| NEL support | Yes | No | No | No | No |
| CSP violation tracking | Yes | No | No | No | No |
| Rage click detection | Yes | No | No | No | No |
| Time on page | Yes | Yes | No | No | Yes |
| Long task tracking | Yes | No | No | No | No |
| A/B testing | Yes | Yes | No | No | Plugin |
| Session replay | Yes | No | No | No | Plugin |
| Scroll milestones | Yes | No | No | No | No |
| Element visibility duration | Yes | No | No | No | No |
| Network status tracking | Yes | No | No | No | No |
| Custom dashboards | Grafana | Limited | No | No | Yes |
| Data ownership | Full | No | No | Yes | Full |
| GDPR compliant | Configurable | Requires consent | Yes | Yes | Configurable |
| Script size | ~8KB | ~45KB | ~5KB | ~1KB | ~22KB |
| Free tier | Unlimited | Limited | Yes | No | Yes |

## Events Tracked Comparison

| Event Type | WireAnalytics | Google Analytics | Cloudflare | Plausible | Matomo |
|------------|---------------|------------------|------------|-----------|--------|
| Page views | Yes | Yes | Yes | Yes | Yes |
| Clicks | Yes | Yes | No | No | Yes |
| Outbound links | Yes | Yes | No | Yes | Yes |
| Scroll depth | Yes | Yes | No | No | Plugin |
| Web Vitals | Yes | Via integration | Yes | No | Plugin |
| JS errors | Yes | No | No | No | Plugin |
| Resource errors | Yes | No | No | No | No |
| Print | Yes | No | No | No | No |
| Copy | Yes | No | No | No | No |
| Rage clicks | Yes | No | No | No | No |
| Time on page | Yes | Yes | No | No | Yes |
| Orientation | Yes | No | No | No | No |
| Resize | Yes | No | No | No | No |
| CSP violations | Yes | No | No | No | No |
| Long tasks | Yes | No | No | No | No |
| Image visibility | Yes | No | No | No | No |
| Right clicks | Yes | No | No | No | No |
| File downloads | Yes | Yes | No | Yes | Yes |
| Form start | Yes | Yes | No | No | Plugin |
| Form submit | Yes | Yes | No | No | Yes |
| Form abandon | Yes | No | No | No | No |
| Network errors (NEL) | Yes | No | No | No | No |
| Scroll milestones | Yes | No | No | No | No |
| A/B testing | Yes | Yes | No | No | Plugin |
| Session replay | Yes | No | No | No | Plugin |
| Element visibility duration | Yes | No | No | No | No |
| Network status | Yes | No | No | No | No |

## Data Collection Comparison

### WireAnalytics

| Category | Data Points |
|----------|-------------|
| Page | URL, path, search, hash, title, referrer |
| Browser | User agent, language, languages, cookies, DNT |
| Screen | Width, height, pixel ratio, viewport, color depth |
| Device | Type, touch, memory, CPU cores |
| Timezone | Name, offset |
| Connection | Type, downlink, RTT |
| Performance | DNS, TCP, TTFB, download, DOM times, load |
| Web Vitals | LCP, FID, CLS, INP, TTFB, FCP |
| Interactions | Clicks, scroll depth, scroll milestones, copy, print, rage clicks, right clicks |
| Errors | JS errors, resource errors, CSP violations |
| Technical | Long tasks, orientation, resize, network status |
| Campaign | UTM source, medium, campaign, term, content, id |
| Identity | Visitor ID (persistent), session ID, user ID |
| Forms | Form start, submit, abandon, time spent, fields interacted |
| Downloads | URL, filename, extension |
| E-commerce | Product views, cart actions, checkout, purchase, refund |
| A/B Testing | Test name, variant, weights |
| Session Replay | Mouse movements, clicks, scrolls, inputs, DOM mutations |
| Element Visibility | Visibility duration, first seen timestamp |
| GeoIP | Country, city, region, postal, lat/long, ASN |

### Google Analytics 4

| Category | Data Points |
|----------|-------------|
| Page | URL, title, referrer |
| Browser | User agent, language |
| Screen | Resolution |
| Device | Category, brand, model |
| Location | Country, city, continent |
| Demographics | Age, gender, interests |
| Performance | Core Web Vitals (via integration) |
| Interactions | Events, conversions, e-commerce |
| Campaign | UTM parameters, Google Ads integration |
| Identity | Client ID, User ID, Google signals |

### Cloudflare Web Analytics

| Category | Data Points |
|----------|-------------|
| Page | URL, path, referrer |
| Browser | Browser name, version |
| Device | Type |
| Location | Country |
| Performance | Core Web Vitals (LCP, FID, CLS) |
| Identity | None (anonymous) |

### Plausible

| Category | Data Points |
|----------|-------------|
| Page | URL, referrer |
| Browser | Browser name |
| Device | Type, OS |
| Location | Country |
| Campaign | UTM parameters |
| Identity | None (anonymous) |

## Architecture Comparison

### WireAnalytics

```
Browser (wa.js) -----> Vector.dev --> VictoriaLogs (events)
                  |               --> VictoriaMetrics (metrics)
Browser (NEL) -----                        |
                                       Grafana
```

**Advantages:**
- Fully customizable pipeline
- Separate storage for logs and metrics
- Flexible query and visualization
- GeoIP enrichment at pipeline level
- Site whitelist filtering
- NEL support for network errors

### Google Analytics

```
Browser --> Google Servers --> BigQuery (optional)
                |
          GA Dashboard
```

**Advantages:**
- Managed service, no maintenance
- Machine learning insights
- Integration with Google Ads

**Disadvantages:**
- Data stored on Google infrastructure
- Export to BigQuery requires paid plan
- Privacy concerns

### Self-hosted alternatives (Plausible, Matomo)

```
Browser --> Application Server --> PostgreSQL/MySQL
                    |
              Built-in Dashboard
```

**Advantages:**
- Single application deployment
- Built-in dashboards
- Traditional database storage

**Disadvantages:**
- Less flexible pipeline
- Limited customization

## Cost Comparison

| Solution | Infrastructure | Data Limits | Hidden Costs |
|----------|---------------|-------------|--------------|
| WireAnalytics | Self-hosted | Unlimited | Server costs, GeoIP license |
| Google Analytics | Free | 10M hits/month | Data ownership |
| Cloudflare | Free | Unlimited | Cloudflare dependency |
| Plausible Cloud | $9+/month | 10K+ pageviews | - |
| Plausible Self-hosted | Self-hosted | Unlimited | Server costs |
| Matomo Cloud | $19+/month | 50K+ hits | - |
| Matomo Self-hosted | Self-hosted | Unlimited | Server costs |

## Privacy Comparison

| Aspect | WireAnalytics | Google Analytics | Cloudflare | Plausible |
|--------|---------------|------------------|------------|-----------|
| Cookies | Configurable | Yes | No | No |
| Privacy mode | Yes | No | Yes (default) | Yes (default) |
| Cross-site tracking | Yes (default) | Yes | No | No |
| Data sharing | No | Yes | No | No |
| IP storage | Configurable | Yes (anonymizable) | No | No |
| Consent required | Configurable | Yes | No | No |
| Data location | Your servers | Google servers | Cloudflare | EU/Your servers |
| GDPR banner needed | Configurable | Yes | No | No |

## Performance Impact

| Solution | Script Size | Requests | Blocking |
|----------|------------|----------|----------|
| WireAnalytics | ~8KB | Beacon API | Non-blocking |
| Google Analytics | ~45KB | Multiple | Can block |
| Cloudflare | ~5KB | Beacon API | Non-blocking |
| Plausible | ~1KB | Single | Non-blocking |
| Matomo | ~22KB | Multiple | Can block |

## When to Choose WireAnalytics

- Full control over data and infrastructure
- Need detailed technical metrics (Web Vitals, long tasks, errors)
- Want custom dashboards with Grafana
- Already using VictoriaMetrics/VictoriaLogs stack
- Need comprehensive interaction tracking (clicks, scroll, copy, rage clicks)
- Want network error monitoring (NEL)
- Need CSP violation tracking
- Privacy with optional visitor identification
- Unlimited data retention

## When to Choose Alternatives

- **Google Analytics**: Need demographics, advertising integration, e-commerce tracking, machine learning insights
- **Cloudflare**: Want zero-config, privacy-first, already using Cloudflare, free unlimited usage
- **Plausible**: Want simple, privacy-first analytics with minimal setup, lightweight script
- **Matomo**: Need Google Analytics feature parity with self-hosting option, built-in dashboards

