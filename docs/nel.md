# Network Error Logging (NEL)

NEL is a browser API that reports network-level errors back to a server. It captures errors that JavaScript cannot detect, such as DNS failures, TCP connection issues, and TLS errors.

## How It Works

```
Browser --> Your Server (with NEL headers)
                |
                v (on network error)
Browser --> NEL Endpoint (/api/v1/nel)
                |
                v
           Vector --> VictoriaLogs
```

## Configuration

### HTTP Response Headers

Add these headers to your server responses:

```
NEL: {"report_to":"nel","max_age":86400,"include_subdomains":true}
Report-To: {"group":"nel","max_age":86400,"endpoints":[{"url":"https://analytics.example.com/api/v1/nel/collect"}]}
```

### Nginx Example

```nginx
add_header NEL '{"report_to":"nel","max_age":86400,"include_subdomains":true}' always;
add_header Report-To '{"group":"nel","max_age":86400,"endpoints":[{"url":"https://analytics.example.com/api/v1/nel/collect"}]}' always;
```

### Caddy Example

```caddyfile
header NEL `{"report_to":"nel","max_age":86400,"include_subdomains":true}`
header Report-To `{"group":"nel","max_age":86400,"endpoints":[{"url":"https://analytics.example.com/api/v1/nel/collect"}]}`
```

### Apache Example

```apache
Header always set NEL "{\"report_to\":\"nel\",\"max_age\":86400,\"include_subdomains\":true}"
Header always set Report-To "{\"group\":\"nel\",\"max_age\":86400,\"endpoints\":[{\"url\":\"https://analytics.example.com/api/v1/nel\"}]}"
```

## NEL Header Options

| Option | Description |
|--------|-------------|
| `report_to` | Name of the reporting group (must match Report-To group) |
| `max_age` | How long browser caches policy (seconds) |
| `include_subdomains` | Apply policy to all subdomains |
| `success_fraction` | Fraction of successful requests to report (0.0-1.0) |
| `failure_fraction` | Fraction of failed requests to report (0.0-1.0, default: 1.0) |

## Error Types Captured

### DNS Errors

| Type | Description |
|------|-------------|
| `dns.unreachable` | DNS server unreachable |
| `dns.name_not_resolved` | Domain name not found |
| `dns.failed` | Other DNS failures |

### TCP Errors

| Type | Description |
|------|-------------|
| `tcp.timed_out` | Connection timed out |
| `tcp.closed` | Connection closed unexpectedly |
| `tcp.reset` | Connection reset |
| `tcp.refused` | Connection refused |
| `tcp.aborted` | Connection aborted |
| `tcp.address_invalid` | Invalid address |
| `tcp.address_unreachable` | Address unreachable |
| `tcp.failed` | Other TCP failures |

### TLS Errors

| Type | Description |
|------|-------------|
| `tls.version_or_cipher_mismatch` | Protocol/cipher mismatch |
| `tls.bad_client_auth_cert` | Client certificate error |
| `tls.cert.name_invalid` | Certificate name mismatch |
| `tls.cert.date_invalid` | Certificate expired/not yet valid |
| `tls.cert.authority_invalid` | Unknown certificate authority |
| `tls.cert.invalid` | Other certificate errors |
| `tls.cert.revoked` | Certificate revoked |
| `tls.cert.pinned_key_not_in_cert_chain` | HPKP failure |
| `tls.protocol.error` | TLS protocol error |
| `tls.failed` | Other TLS failures |

### HTTP Errors

| Type | Description |
|------|-------------|
| `http.error` | HTTP protocol error |
| `http.protocol.error` | HTTP/2 or HTTP/3 protocol error |
| `http.response.invalid` | Invalid HTTP response |
| `http.response.redirect_loop` | Redirect loop detected |
| `http.failed` | Other HTTP failures |

### Other Errors

| Type | Description |
|------|-------------|
| `abandoned` | User navigated away before completion |
| `unknown` | Unknown error |

## Report Phases

| Phase | Description |
|-------|-------------|
| `dns` | Error during DNS resolution |
| `connection` | Error during connection establishment |
| `application` | Error during data transfer |

## Data Schema

Each NEL report stored in VictoriaLogs contains:

| Field | Description |
|-------|-------------|
| `timestamp` | When the report was received |
| `log_class` | Always "nel" |
| `site_id` | Hostname from the failed URL |
| `event` | "nel_" + error type |
| `type` | Report type (always "network-error") |
| `url` | URL that failed |
| `user_agent` | Browser user agent |
| `phase` | Error phase (dns/connection/application) |
| `error_type` | Specific error type |
| `elapsed_time` | Time elapsed before error (ms) |
| `status_code` | HTTP status code (if available) |
| `protocol` | Protocol used (h2, h3, etc.) |
| `method` | HTTP method |
| `referrer` | Referrer URL |
| `sampling_fraction` | Sampling rate |
| `server_ip` | Server IP address (if resolved) |

## Querying NEL Data

### VictoriaLogs Queries

```
# All NEL reports
{log_class="nel"}

# DNS errors only
{log_class="nel"} | event:~"nel_dns.*"

# TLS certificate errors
{log_class="nel"} | event:~"nel_tls.cert.*"

# Errors for specific site
{log_class="nel", site_id="example.com"}

# Connection timeouts
{log_class="nel", event="nel_tcp.timed_out"}
```

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | 71+ |
| Edge | 79+ |
| Opera | 58+ |
| Firefox | Not supported |
| Safari | Not supported |

## Security Considerations

- NEL endpoint must support CORS
- Use HTTPS for the reporting endpoint
- Consider rate limiting to prevent abuse
- NEL reports may contain sensitive URLs
