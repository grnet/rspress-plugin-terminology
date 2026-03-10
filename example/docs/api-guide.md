---
title: API Guide
---

# API Guide

This guide explains how to use our API effectively and securely.

## Authentication

To use the API, you need a valid [API Key](./terms/api-key). Each key is unique to your account and should be kept secret.

### Getting Your API Key

1. Sign in to your account
2. Navigate to Settings > API Keys
3. Click "Generate New Key"
4. Copy and securely store your key

### Using Your Key

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.example.com/v1/users
```

## Rate Limits

Our API implements [Rate Limiting](./terms/rate-limiting) to ensure fair usage for all customers.

| Plan | Requests per Hour | Requests per Day |
|------|-------------------|------------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 10,000 |
| Enterprise | Unlimited | Unlimited |

When you exceed your limit, you'll receive a `429 Too Many Requests` response.

## Webhooks

You can set up [Webhooks](./terms/webhook) to receive real-time notifications about events in your account.

### Supported Events

- `user.created` - New user signup
- `user.deleted` - User account deleted
- `payment.succeeded` - Successful payment
- `payment.failed` - Payment attempt failed

### Webhook Security

All webhook requests are signed using HMAC-SHA256. Verify the signature to ensure the request is genuine:

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');
```

## OAuth Integration

For third-party integrations, we support [OAuth](./terms/oauth) 2.0. This allows users to grant your application access without sharing their credentials.

### OAuth Flow

1. Redirect users to our authorization page
2. User approves your application
3. User is redirected back with an authorization code
4. Exchange the code for an access token

### Example

```javascript
const authUrl = `https://api.example.com/oauth/authorize?
  client_id=${CLIENT_ID}&
  response_type=code&
  redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

// Redirect user to authUrl
```

## Best Practices

1. **Secure Your Keys**: Never commit [API Key](./terms/api-key) to version control
2. **Handle Limits**: Implement exponential backoff when hitting [Rate Limiting](./terms/rate-limiting)
3. **Validate Webhooks**: Always verify webhook signatures
4. **Use OAuth**: For user integrations, prefer [OAuth](./terms/oauth) over direct credentials

## Need Help?

Check the [Glossary](./glossary) for term definitions, or contact support for more assistance.
