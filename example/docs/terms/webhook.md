---
id: webhook
title: Webhook
hoverText: An HTTP callback that sends data to a URL when an event occurs.
---

A **Webhook** is a method of augmenting or altering the behavior of a web page or web application with custom callbacks. These callbacks may be maintained, modified, and managed by third-party users and developers.

## How Webhooks Work

1. **Event Occurs**: An action happens in the source system
2. **HTTP Request**: The system sends an HTTP POST to a configured URL
3. **Data Delivery**: Event data is sent as JSON or XML
4. **Acknowledgment**: The receiving server responds with 2xx status

## Common Use Cases

- **Git Events**: Push, pull request, merge notifications
- **Payment Events**: Successful transactions, failed payments
- **CI/CD**: Build completion, deployment status
- **SaaS**: User signup, subscription changes

## Example Payload

```json
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "userId": "12345",
    "email": "user@example.com"
  }
}
```
