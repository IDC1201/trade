# Accessibility Guidelines - BAZ Crypto Tech

This document outlines the accessibility features and guidelines for the BAZ Crypto Tech dashboard.

## Overview

BAZ Crypto Tech is built with accessibility in mind to ensure all users, including those with disabilities, can effectively use the trading bot platform.

## Keyboard Navigation

### Global Shortcuts
- **Tab**: Navigate between interactive elements
- **Shift + Tab**: Navigate backwards
- **Enter**: Activate buttons and submit forms
- **Space**: Toggle checkboxes and switches
- **Escape**: Close modals and dropdowns
- **Arrow Keys**: Navigate within select menus and tabs

### Dashboard Navigation
- **Tab** through sidebar menu items
- **Enter** to select a menu item
- **Tab** to navigate dashboard controls (Start/Stop buttons, filters)

### Form Navigation
- **Tab** through form fields
- **Enter** to submit forms
- **Shift + Tab** to go back to previous field

## Screen Reader Support

### Semantic HTML
All pages use semantic HTML elements:
- `<button>` for interactive elements (not `<div>` with click handlers)
- `<label>` associated with form inputs via `htmlFor`
- `<table>` with proper `<thead>`, `<tbody>`, `<th>` structure
- `<nav>` for navigation sections

### ARIA Labels and Descriptions
Key elements include ARIA attributes:

```tsx
// Button with aria-label
<Button aria-label="Start trading bot">
  <Play className="w-4 h-4" />
</Button>

// Form field with description
<Input
  id="apiKey"
  aria-label="Binance API Key"
  aria-describedby="apiKey-help"
/>
<p id="apiKey-help" className="text-xs text-muted-foreground">
  Get your API key from Binance Account → API Management
</p>

// Live region for status updates
<div aria-live="polite" aria-atomic="true">
  Bot status: {status}
</div>
```

### Focus Management
- All interactive elements are keyboard accessible
- Focus indicators are visible (blue outline on dark background)
- Focus is managed properly when modals open/close
- Skip links available for keyboard users

## Color Contrast

### WCAG AA Compliance
- Text contrast ratio: minimum 4.5:1 for normal text
- Large text (18pt+) contrast ratio: minimum 3:1
- UI component contrast ratio: minimum 3:1

### Color Scheme
- Primary: Blue (#3b82f6) on dark background
- Success: Green (#10b981)
- Warning: Amber (#f59e0b)
- Danger: Red (#ef4444)
- Text: White on dark background

### Testing
Use tools like:
- WebAIM Contrast Checker
- Axe DevTools
- Lighthouse Accessibility Audit

## Form Accessibility

### Input Fields
```tsx
<div className="space-y-2">
  <Label htmlFor="leverage">Leverage</Label>
  <Input
    id="leverage"
    type="number"
    min="1"
    max="125"
    aria-label="Trading leverage"
    aria-describedby="leverage-help"
  />
  <p id="leverage-help" className="text-xs text-muted-foreground">
    Trading leverage (1-125x). Higher leverage = higher risk.
  </p>
</div>
```

### Error Messages
```tsx
{errors.leverage && (
  <p id="leverage-error" className="text-xs text-red-500" role="alert">
    {errors.leverage.message}
  </p>
)}
```

### Select Dropdowns
- Use native `<select>` or accessible component
- Label all selects with `<label>`
- Provide clear option descriptions

## Data Tables

### Accessible Table Structure
```tsx
<table>
  <thead>
    <tr>
      <th scope="col">Symbol</th>
      <th scope="col">Direction</th>
      <th scope="col">Entry Price</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>BTCUSDT</td>
      <td>LONG</td>
      <td>$42,500</td>
    </tr>
  </tbody>
</table>
```

### Table Accessibility
- Use `<th scope="col">` for column headers
- Use `<th scope="row">` for row headers if applicable
- Provide table captions or descriptions
- Keep tables simple and well-structured

## Charts and Visualizations

### Recharts Accessibility
```tsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart
    data={data}
    aria-label="Portfolio equity curve"
    role="img"
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Area type="monotone" dataKey="totalPnL" />
  </AreaChart>
</ResponsiveContainer>
```

### Chart Descriptions
Provide text descriptions for complex charts:
```tsx
<div className="mt-4 text-sm text-muted-foreground">
  <p>
    Portfolio equity curve showing daily PnL from Jan 1 to Dec 31.
    Peak value: $10,500 on March 15. Lowest value: $8,200 on February 20.
  </p>
</div>
```

## Status Indicators

### Live Regions
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {botStatus.isRunning ? "Bot is running" : "Bot is stopped"}
</div>

<div className="flex items-center gap-2">
  <div
    className={`w-3 h-3 rounded-full ${
      botStatus.isRunning ? "bg-green-500" : "bg-gray-500"
    }`}
    aria-hidden="true"
  />
  <span>{botStatus.isRunning ? "Running" : "Stopped"}</span>
</div>
```

### Loading States
```tsx
{isLoading ? (
  <div role="status" aria-live="polite">
    <Spinner />
    <span className="sr-only">Loading data...</span>
  </div>
) : (
  // Content
)}
```

## Responsive Design

### Mobile Accessibility
- Touch targets: minimum 44x44 pixels
- Sufficient spacing between interactive elements
- Readable font sizes (minimum 16px on mobile)
- Responsive layout that works on all screen sizes

### Zoom Support
- Content remains readable at 200% zoom
- No horizontal scrolling at 200% zoom
- All functionality accessible at any zoom level

## Testing for Accessibility

### Automated Testing
```bash
# Run accessibility audit
pnpm test:a11y

# Use Lighthouse
pnpm build && lighthouse https://localhost:3000
```

### Manual Testing
1. **Keyboard Navigation**
   - Navigate entire site using only Tab key
   - Verify focus is always visible
   - Ensure all interactive elements are reachable

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or JAWS
   - Test with VoiceOver (macOS/iOS)
   - Test with TalkBack (Android)

3. **Color Contrast**
   - Use WebAIM Contrast Checker
   - Verify 4.5:1 ratio for normal text
   - Test with color blindness simulator

4. **Zoom Testing**
   - Test at 200% zoom
   - Verify no horizontal scrolling
   - Check layout integrity

## Common Issues and Fixes

### Issue: Missing Form Labels
**Fix**: Always use `<label htmlFor="id">` for form inputs
```tsx
// ❌ Bad
<Input placeholder="API Key" />

// ✅ Good
<Label htmlFor="apiKey">API Key</Label>
<Input id="apiKey" />
```

### Issue: Inaccessible Buttons
**Fix**: Use `<button>` element instead of `<div>`
```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<Button onClick={handleClick}>Click me</Button>
```

### Issue: Missing Alt Text
**Fix**: Provide meaningful descriptions for images
```tsx
// ❌ Bad
<img src="chart.png" />

// ✅ Good
<img src="chart.png" alt="Portfolio equity curve chart" />
```

### Issue: Color-Only Indicators
**Fix**: Use text or icons in addition to color
```tsx
// ❌ Bad
<div className="bg-red-500" />

// ✅ Good
<div className="flex items-center gap-2">
  <div className="w-3 h-3 rounded-full bg-red-500" />
  <span>Error</span>
</div>
```

## Resources

### WCAG Guidelines
- [WCAG 2.1 Overview](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/?currentsetting=level%20aa)

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Testing
- [Screen Reader Testing](https://www.w3.org/WAI/test-evaluate/testing-overview/)
- [Keyboard Accessibility Testing](https://www.w3.org/WAI/test-evaluate/keyboard/)

## Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Form labels are properly associated
- [ ] Error messages are clear and linked to inputs
- [ ] Images have meaningful alt text
- [ ] Tables have proper headers and structure
- [ ] Charts have text descriptions
- [ ] Live regions announce updates
- [ ] Page structure is logical with proper headings
- [ ] No keyboard traps
- [ ] Touch targets are at least 44x44 pixels
- [ ] Content is readable at 200% zoom
- [ ] Tested with screen readers
- [ ] Tested with keyboard navigation only

## Continuous Improvement

Accessibility is an ongoing process. We continuously:
- Monitor accessibility audit results
- Test with real users with disabilities
- Update components based on feedback
- Keep dependencies updated for accessibility fixes
- Review and update guidelines regularly

---

For questions or accessibility issues, please report them in the GitHub issues tracker.
