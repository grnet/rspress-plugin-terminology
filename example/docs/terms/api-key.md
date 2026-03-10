---
id: api-key
title: API Key
hoverText: A unique identifier used to authenticate with an API.
---

An **API Key** is a secret token that identifies the calling application or user to an API. It's used for:

- Authentication: Verifying the identity of the caller
- Authorization: Checking if the caller has permission to access resources
- Rate Limiting: Tracking usage per application or user

## Security Best Practices

1. **Never expose API keys in client-side code**
2. **Rotate keys regularly** - Set up automatic rotation schedules
3. **Use environment variables** - Store keys in `.env` files or secrets managers
4. **Implement key scopes** - Different keys for different access levels
5. **Monitor usage** - Track and alert on unusual activity

## Example Usage

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.example.com/v1/users
```
