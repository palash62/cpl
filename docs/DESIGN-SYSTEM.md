# CPL Platform — Design System

**Version:** 1.0  
**Stack:** Shadcn UI · Tailwind CSS · Lucide Icons · Inter Font

---

## Design Philosophy

Premium SaaS aesthetic inspired by HubSpot CRM, Stripe Dashboard, and GoHighLevel.

**Goals:** Modern · Clean · Fast · Professional · Enterprise-ready · Mobile Responsive

**Avoid:** Dark heavy UI · Too many colors · Cluttered dashboards

---

## Color Tokens

| Token | Value | CSS Variable | Usage |
|-------|-------|--------------|-------|
| Primary | `#2563EB` | `--primary` | CTAs, active nav, links |
| Secondary | `#14B8A6` | `--secondary` | Accents, badges |
| Success | `#22C55E` | `--success` | Approved, positive metrics |
| Warning | `#F59E0B` | `--warning` | Pending, caps nearing |
| Danger | `#EF4444` | `--destructive` | Rejected, errors, destructive |
| Background | `#F8FAFC` | `--background` | Page background |
| Card | `#FFFFFF` | `--card` | Cards, modals |
| Text Primary | `#0F172A` | `--foreground` | Primary text |
| Text Secondary | `#64748B` | `--muted-foreground` | Secondary text |
| Border | `#E2E8F0` | `--border` | Dividers, inputs |

### Shadcn CSS Variables (`globals.css`)

```css
:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 173 80% 40%;
  --secondary-foreground: 210 40% 98%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
}
```

---

## Typography

**Font Family:** Inter (Google Fonts)

| Level | Size | Weight | Tailwind Class |
|-------|------|--------|----------------|
| H1 | 30px / 1.875rem | 700 | `text-3xl font-bold` |
| H2 | 24px | 600 | `text-2xl font-semibold` |
| H3 | 20px | 600 | `text-xl font-semibold` |
| Body | 14px | 400 | `text-sm` |
| Small | 12px | 400 | `text-xs` |
| Label | 14px | 500 | `text-sm font-medium` |

---

## Spacing & Layout

| Element | Value |
|---------|-------|
| Sidebar width | 256px (collapsed: 64px icon-only) |
| Header height | 64px |
| Content max-width | 1280px (dashboard); full-width for tables |
| Card padding | 24px (`p-6`) |
| Border radius (cards) | 8px (`rounded-lg`) |
| Border radius (buttons/inputs) | 6px (`rounded-md`) |
| Default shadow | `shadow-sm` |
| Interactive card hover | `shadow-md` |

### Global Shell Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Breadcrumb Trail          [Search] [🔔] [Avatar]│  ← Header (64px)
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │  Page Title + Actions                        │
│ (256px)  │  ─────────────────────────────────────────  │
│          │  Main Content (cards, tables, charts)        │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

## Shadcn Components (MVP)

Install via `npx shadcn@latest add <component>`:

| Category | Components |
|----------|------------|
| Forms | Button, Input, Label, Select, Textarea, Form, Checkbox, Switch |
| Data Display | Card, Table, Badge, Avatar, Tabs, Progress, Tooltip |
| Feedback | Toast (Sonner), Alert, Skeleton |
| Overlay | Dialog, Sheet, Popover, Dropdown Menu |
| Navigation | Breadcrumb, Separator, Pagination |
| Advanced | Command (search), Calendar, DatePicker, DataTable (TanStack Table) |

---

## Component Patterns

### Stat Cards

```
┌─────────────────────────────┐
│ [Icon]  Label               │
│         1,234               │
│         ↑ 12% vs last period│
└─────────────────────────────┘
```

- Lucide icon (muted color) + label (text-muted-foreground)
- Large number (text-2xl font-bold)
- Trend badge: green for positive, red for negative

### Data Tables

- Sticky header
- Row hover (`hover:bg-muted/50`)
- Column sort indicators
- Filters bar above table
- Pagination below
- Empty state with illustration + CTA

### Forms

- Single-column layout
- Section headers with descriptions
- Inline validation (red border + message)
- Sticky save bar on long forms (bottom fixed)

### Status Badges

| Status | Color | Variant |
|--------|-------|---------|
| approved | Green | `bg-green-100 text-green-800` |
| pending | Amber | `bg-amber-100 text-amber-800` |
| rejected | Red | `bg-red-100 text-red-800` |
| paused | Gray | `bg-gray-100 text-gray-800` |
| active | Blue | `bg-blue-100 text-blue-800` |

### Empty States

- Centered layout
- Subtle illustration or icon (64px, muted)
- Headline (H3)
- Description (muted text)
- Primary CTA button

### Loading States

- Skeleton loaders matching layout shape
- Never spinner-only for page loads
- Pulse animation on skeleton blocks

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `< 768px` | Sidebar → Sheet drawer; stat cards 1-col; tables → card list |
| `768–1024px` | Sidebar collapsed by default |
| `> 1024px` | Full sidebar expanded |

### Mobile Navigation

- Hamburger menu triggers Sheet from left
- Bottom-safe padding for mobile browsers
- Touch targets minimum 44px

---

## Iconography

**Library:** Lucide React

| Context | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Campaigns | `Megaphone` |
| Leads | `Users` |
| Wallet | `Wallet` |
| Payouts | `Banknote` |
| Reports | `BarChart3` |
| Settings | `Settings` |
| Support | `LifeBuoy` |
| Notifications | `Bell` |
| Search | `Search` |
| Add/Create | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Export | `Download` |
| Approve | `CheckCircle` |
| Reject | `XCircle` |

---

## Accessibility

- WCAG 2.1 AA compliance for core flows
- Focus rings on all interactive elements (`ring-2 ring-primary`)
- Sufficient color contrast (4.5:1 minimum)
- Screen reader labels on icon-only buttons
- Keyboard navigation for modals and dropdowns
