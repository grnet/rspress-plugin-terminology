---
title: Tooltip Tests
---

# Tooltip Placement Tests

This page demonstrates the different tooltip placement options available in the rspress-terminology plugin.

import Term from 'rspress-terminology/runtime/Term';

## Default Placement (Top)

By default, tooltips appear **above** the term. Hover over this term to see:

- <Term pathName="/terms/api-key">API Key</Term> - uses default top placement

## Top Placement

The most common placement, appearing above the term:

- <Term pathName="/terms/oauth" placement="top">OAuth</Term> - positioned above the term
- <Term pathName="/terms/webhook" placement="top">Webhook</Term> - positioned above the term

## Bottom Placement

For terms near the top of the viewport, bottom placement can be more appropriate:

- <Term pathName="/terms/rate-limiting" placement="bottom">Rate Limiting</Term> - positioned below the term

## Left Placement

Useful for terms on the right side of content:

- <Term pathName="/terms/api-key" placement="left">API Key</Term> - positioned to the left

## Right Placement

Useful for terms on the left side of content:

- <Term pathName="/terms/oauth" placement="right">OAuth</Term> - positioned to the right

## Test Scenarios

### Edge Cases

1. **Near viewport edges** - Tooltips should remain visible
2. **Multiple terms close together** - Each tooltip should work independently
3. **Long text content** - Tooltip should handle longer descriptions gracefully

### Interactive Behavior

- **Hover delay** - Tooltips appear after 300ms (default)
- **Hide delay** - Tooltips disappear after 100ms (default)
- **Smooth animation** - Fade-in effect without positioning issues

## Usage

To specify tooltip placement, use the Term component with the `placement` prop:

```jsx
import Term from 'rspress-terminology/runtime/Term';

// Default placement (top)
<Term pathName="/terms/term-name">Term</Term>

// Specific placements
<Term pathName="/terms/term-name" placement="top">Term</Term>
<Term pathName="/terms/term-name" placement="bottom">Term</Term>
<Term pathName="/terms/term-name" placement="left">Term</Term>
<Term pathName="/terms/term-name" placement="right">Term</Term>
```

> **Note:** If not specified, the default placement is `top`.

## Browser Testing

Test the tooltips in different browsers:

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (touch interaction)
