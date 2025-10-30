# Design Document

## Overview

The Organization Master page redesign focuses on creating a modern, clean, and user-friendly interface that improves upon the existing functionality while maintaining all current features. The design leverages the existing shadcn/ui component library and Tailwind CSS design system to create a cohesive and professional experience.

The redesign transforms the current basic card layout and drawer-based detail view into a more sophisticated interface with improved visual hierarchy, better data presentation, and enhanced user interactions.

## Architecture

### Component Structure

```
OrganizationMaster/
├── OrganizationMasterPage (Main container)
├── CompanyGrid (Company cards display)
│   └── CompanyCard (Individual company card)
├── CompanyDetailsSheet (Side panel for company details)
│   ├── CompanyHeader (Company info header)
│   ├── OrganizationTabs (Tabbed navigation)
│   └── DataTable (Reusable table component)
├── CreateEditModal (Form modal for CRUD operations)
└── EmptyState (No data state component)
```

### Design System Integration

- **Component Library**: shadcn/ui components for consistent styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Color Scheme**: Slate-based palette with proper contrast ratios
- **Typography**: Consistent font hierarchy and spacing
- **Icons**: Lucide React icons for consistency

## Components and Interfaces

### 1. Main Page Layout

**Visual Design:**
- Clean header with title and subtitle
- Responsive grid layout for company cards
- Proper spacing and visual hierarchy
- Loading states with skeleton components

**Key Features:**
- Search and filter functionality (future-ready)
- Responsive grid that adapts to screen size
- Empty state when no companies exist
- Consistent spacing using Tailwind's spacing scale

### 2. Company Cards

**Enhanced Design:**
- Modern card design with subtle shadows and hover effects
- Clear company information hierarchy
- Visual indicators for company status
- Improved typography and spacing

**Card Structure:**
```
┌─────────────────────────┐
│ Company Name            │
│ ─────────────────────   │
│ Address Line 1          │
│ Address Line 2          │
│ Pincode: XXXXXX         │
│                         │
│ [View Details] →        │
└─────────────────────────┘
```

### 3. Company Details Sheet

**Improved Layout:**
- Side sheet instead of bottom drawer for better desktop experience
- Company header with key information
- Tabbed navigation for different data types
- Action buttons positioned contextually

**Sheet Structure:**
```
┌─────────────────────────────────┐
│ [×] Company Name                │
│ ─────────────────────────────── │
│ Address | Pincode | Contact     │
│                                 │
│ ┌─────┐ ┌─────────┐ ┌─────────┐ │
│ │Dept.│ │Designat.│ │Emp.Type │ │
│ └─────┘ └─────────┘ └─────────┘ │
│                                 │
│ [+ Add New]                     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │        Data Table           │ │
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 4. Data Tables

**Modern Table Design:**
- Clean table styling with proper spacing
- Hover effects for rows
- Action buttons with consistent styling
- Pagination with proper controls
- Loading states and empty states

**Table Features:**
- Sortable columns (future enhancement)
- Row selection (future enhancement)
- Responsive design for mobile
- Clear action buttons (Edit/Delete)

### 5. Forms and Modals

**Enhanced Form Design:**
- Modal dialogs instead of inline forms
- Proper form validation with error states
- Clear field labels and help text
- Consistent button styling and placement

**Form Structure:**
- Vertical layout with proper spacing
- Required field indicators
- Validation feedback
- Clear primary and secondary actions

## Data Models

### Company Interface
```typescript
interface Company {
  id: number;
  name: string;
  address: string;
  pincode: string;
  // Additional fields as needed
}
```

### Department Interface
```typescript
interface Department {
  department_id: number;
  dept_name: string;
  dept_code: string;
  description?: string;
  company: number;
}
```

### Designation Interface
```typescript
interface Designation {
  designation_id: number;
  designation_name: string;
  designation_code: string;
  description?: string;
}
```

### Employee Type Interface
```typescript
interface EmployeeType {
  type: string;
  description?: string;
}
```

## Error Handling

### User-Friendly Error Messages
- Clear, actionable error messages
- Toast notifications for success/error states
- Form validation with inline error display
- Network error handling with retry options

### Loading States
- Skeleton loaders for initial page load
- Spinner components for data fetching
- Disabled states for forms during submission
- Progress indicators for long operations

### Empty States
- Helpful messaging when no data exists
- Clear call-to-action buttons
- Illustrations or icons to improve visual appeal
- Guidance for next steps

## Testing Strategy

### Component Testing
- Unit tests for individual components
- Props validation and rendering tests
- User interaction testing (clicks, form submissions)
- Error state testing

### Integration Testing
- API integration testing with mock data
- Form submission and validation flows
- Navigation and routing tests
- Responsive design testing

### Accessibility Testing
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Focus management testing

### Visual Regression Testing
- Component screenshot comparisons
- Cross-browser compatibility
- Responsive design validation
- Theme consistency checks

## Design Specifications

### Color Palette
- Primary: `hsl(var(--primary))` - Main action buttons
- Secondary: `hsl(var(--secondary))` - Secondary actions
- Muted: `hsl(var(--muted))` - Background elements
- Border: `hsl(var(--border))` - Dividers and borders
- Destructive: `hsl(var(--destructive))` - Delete actions

### Typography Scale
- Heading 1: `text-2xl font-semibold` (24px, 600 weight)
- Heading 2: `text-xl font-medium` (20px, 500 weight)
- Body: `text-sm` (14px, 400 weight)
- Caption: `text-xs text-muted-foreground` (12px, muted)

### Spacing System
- Container padding: `p-6` (24px)
- Card spacing: `gap-4` (16px)
- Form spacing: `space-y-4` (16px vertical)
- Button padding: `px-4 py-2` (16px horizontal, 8px vertical)

### Component Specifications

#### Company Cards
- Width: `min-w-[280px]` with flexible growth
- Padding: `p-6`
- Border radius: `rounded-lg`
- Shadow: `shadow-sm hover:shadow-md`
- Transition: `transition-shadow duration-200`

#### Data Tables
- Row height: `h-12` (48px)
- Cell padding: `px-4 py-2`
- Header styling: `font-medium text-muted-foreground`
- Hover state: `hover:bg-muted/50`

#### Forms
- Input height: `h-10` (40px)
- Label spacing: `mb-2`
- Error text: `text-xs text-destructive`
- Button height: `h-10` (40px)

### Responsive Breakpoints
- Mobile: `< 640px` - Single column layout
- Tablet: `640px - 1024px` - 2-3 column grid
- Desktop: `> 1024px` - 3-4 column grid
- Large screens: `> 1280px` - 4+ column grid

### Animation and Transitions
- Hover transitions: `200ms ease-in-out`
- Modal animations: `300ms ease-out`
- Loading states: Smooth fade-in/out
- Sheet slide animations: `250ms ease-in-out`