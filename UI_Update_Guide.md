# RideBoard - UI Modernization Guide

## 1. Objective
To modernize the RideBoard interface using standardized web components and specialized UI libraries, minimizing custom CSS while achieving a premium, consistent design.

## 2. Recommended Technology Stack
- **Component Library**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI + Tailwind CSS).
- **Icons**: [Lucide React](https://lucide.dev/).
- **Animations**: [Framer Motion](https://www.framer.com/motion/).
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/).

## 3. Key UI Updates
### 3.1. Navigation & Layout
- Replace the custom `Navbar.jsx` with a Shadcn `NavigationMenu`.
- Use a `Sidebar` or `BottomNav` for mobile-first accessibility.
- Implement a `Command` menu (Cmd+K) for quick ride searching and navigation.

### 3.2. Ride Discovery
- **Search Cards**: Use Shadcn `Card` components with `Badge` for status (Active, Full, etc.).
- **Skeleton Loading**: Implement `Skeleton` screens for the ride list to improve perceived performance.
- **Filters**: Use `Sheet` or `Drawer` for advanced filters on mobile.

### 3.3. Posting Rides
- **Stepper Form**: Use a multi-step form with a `Progress` bar.
- **Address Selection**: Integrate a headless `Combobox` for address autocomplete.
- **Map Interaction**: Use a refined `Sheet` or `Dialog` for the map picker.

### 3.4. Chat & Communication
- **Chat Interface**: Use a scrollable `ScrollArea` with message bubbles styled using Shadcn's theme tokens.
- **Status Indicators**: Use `Avatar` with a status ring to show online/offline or "Cancelled Rider" status.

## 4. Minimal Styling Principles
- **Tokens over Pixels**: Use CSS variables (primary, secondary, accent) defined in a global theme rather than hardcoded hex values.
- **Utility Classes**: Use Tailwind CSS (or similar utility frameworks) for layout and spacing to keep the CSS bundle small and predictable.
- **Consistency**: All buttons, inputs, and modals should share the same border radius and shadow depth.

## 5. Visual Inspiration
- **Glassmorphism**: Use `backdrop-blur` for overlays and navigation bars.
- **Micro-animations**: Add subtle `hover` scaling and `fade-in` transitions for cards and list items.
- **Dark Mode**: Implement a system-wide toggle using `next-themes` or standard CSS media queries.
