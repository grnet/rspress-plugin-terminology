---
id: oauth
title: OAuth
hoverText: An open standard for secure API authorization.
---

**OAuth** (Open Authorization) is an open standard for access delegation, commonly used as a way for users to grant websites or applications access to their information on other websites but without giving them the passwords.

## OAuth 2.0 Flow

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│  User   │─────▶│ Client  │─────▶│  Auth   │─────▶│ Resource │
│         │◀─────│  App    │◀─────│ Server  │◀─────│ Server  │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
    1                2                3                4
```

## Key Components

- **Resource Owner**: The user who owns the data
- **Client**: The application requesting access
- **Authorization Server**: Issues access tokens
- **Resource Server**: Hosts the protected data

## Grant Types

| Type | Description | Use Case |
|------|-------------|----------|
| Authorization Code | Most secure, requires user interaction | Server-side apps |
| Implicit | Less secure, token in URL fragment | SPA/Mobile apps |
| Client Credentials | Application-level permissions | Service-to-service |
| Device Code | For devices with limited input | IoT devices |

## Example Response

```json
{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8"
}
```
