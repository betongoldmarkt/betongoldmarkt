---
name: frontend-design
description: Assist with frontend design tasks including CSS styling, component design, UI/UX improvements, and responsive layouts. Use when working on visual design, layout, user interface elements, or design system implementation.
---

# Frontend Design Skill

## Design Principles

When creating or modifying frontend designs:

### Visual Hierarchy
- Use typography scale for clear information hierarchy
- Implement proper spacing with consistent margin/padding system
- Apply color contrast ratios for accessibility (WCAG 2.1 AA minimum)
- Create focal points with size, color, and positioning

### Responsive Design
- Mobile-first approach: design for small screens first
- Use fluid typography and spacing (clamp(), viewport units)
- Implement breakpoint system for different screen sizes
- Test on actual devices, not just browser dev tools

### Performance Considerations
- Optimize images and assets (WebP, lazy loading, responsive images)
- Minimize CSS/JS bundle sizes
- Use CSS Grid and Flexbox for efficient layouts
- Implement critical CSS for above-the-fold content

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color-independent design (don't rely on color alone)

## Common Design Tasks

### Layout Systems
- CSS Grid for complex 2D layouts
- Flexbox for 1D layouts and component alignment
- Container queries for component-based responsive design
- CSS custom properties for consistent spacing

### Component Design
- Design system consistency (colors, typography, spacing)
- State management (hover, focus, active, disabled)
- Micro-interactions and animations
- Component composition and reusability

### Typography
- Font loading optimization (font-display: swap)
- Line-height optimization (1.4-1.6 for body text)
- Text contrast and readability
- Responsive typography scaling

### Color and Visual Effects
- Color palette with semantic naming
- CSS custom properties for theme management
- Subtle shadows and depth
- Smooth transitions and animations

## Implementation Guidelines

### CSS Architecture
- BEM methodology for class naming
- CSS custom properties for design tokens
- Utility-first approach where appropriate
- Component-scoped styles

### Cross-browser Compatibility
- Progressive enhancement
- Vendor prefixes for older browsers
- Feature detection and fallbacks
- Testing across different browsers

### Performance Optimization
- Minimize repaints and reflows
- Efficient CSS selectors
- Critical rendering path optimization
- Bundle analysis and optimization

## Tools and Techniques

- CSS Grid and Flexbox for modern layouts
- CSS custom properties for design systems
- clamp() and min/max for fluid design
- CSS-in-JS or utility classes as appropriate
- Design tools integration (Figma, Adobe XD)

Use this skill when asked to:
- Create responsive layouts
- Style UI components
- Implement design systems
- Optimize visual performance
- Ensure accessibility compliance
- Build mobile-first interfaces