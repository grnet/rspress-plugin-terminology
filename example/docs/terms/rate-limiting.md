---
id: rate-limiting
title: Rate Limiting
hoverText: Controlling the rate of requests sent or received by an API.
---

**Rate Limiting** is a technique used to control the rate of traffic sent or received by a server, network, or application.

## Why Rate Limiting?

- **Prevent Abuse**: Stop malicious actors from overwhelming your system
- **Fair Usage**: Ensure equal access for all users
- **Cost Management**: Control cloud costs by limiting API calls
- **System Stability**: Prevent servers from crashing due to traffic spikes

## Common Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| Fixed Window | Resets limit at fixed intervals | Simple quotas |
| Sliding Window | Tracks requests in rolling time period | Smoother experience |
| Token Bucket | Bursts allowed, refills over time | APIs with burst patterns |
| Leaky Bucket | Steady drip of requests | Constant processing rate |

## HTTP Headers

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1638364800
```
