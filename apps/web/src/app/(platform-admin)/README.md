# Platform Admin Panel

Complete frontend implementation for DockPulse Platform Administration.

## Overview

The Platform Admin Panel provides a comprehensive interface for managing the multi-tenant DockPulse platform. It allows platform administrators to manage tenants, install/uninstall modules, monitor system statistics, and configure platform-wide settings.

## Features

### 1. Dashboard (`/dashboard`)
- Platform-wide statistics (tenants, modules, users, events)
- Growth trend charts
- Recent activity feed
- Quick action buttons

### 2. Tenants Management (`/tenants`)
- List all tenants with search and filtering
- View tenant details
- Create new tenants
- Monitor tenant status (active, inactive, suspended)
- Track storage usage and user counts

### 3. Tenant Details (`/tenants/[id]`)
- Tenant information overview
- Installed modules management
- Module enable/disable toggles
- Module installation/uninstallation
- User list for each tenant
- Recent events and activity

### 4. Module Catalog (`/modules`)
- Browse all available modules
- Filter by category (Operations, Finance, Vessels, Port Services, Analytics)
- Search functionality
- View module details (description, features, dependencies)
- Installation statistics

## Project Structure

```
apps/web/src/app/(platform-admin)/
├── layout.tsx              # Main layout with sidebar navigation
├── page.tsx                # Root redirect to dashboard
├── dashboard/
│   └── page.tsx            # Platform statistics dashboard
├── tenants/
│   ├── page.tsx            # Tenants list with search/filter
│   └── [id]/
│       └── page.tsx        # Individual tenant details
└── modules/
    └── page.tsx            # Module catalog

apps/web/src/lib/platform-admin/
├── api.ts                  # API client functions
└── utils.ts                # Utility functions (formatting, validation)

apps/web/src/components/platform-admin/
├── LoadingSpinner.tsx      # Loading states
├── StatusBadge.tsx         # Status indicators
└── EmptyState.tsx          # Empty/error states
```

## API Integration

The frontend connects to these backend endpoints:

### Statistics
- `GET /api/admin/stats` - Platform statistics

### Tenants
- `GET /api/admin/tenants` - List all tenants
- `GET /api/admin/tenants/:id` - Get tenant details
- `POST /api/admin/tenants` - Create new tenant
- `PATCH /api/admin/tenants/:id` - Update tenant
- `DELETE /api/admin/tenants/:id` - Delete tenant

### Modules
- `GET /api/admin/modules` - Get module catalog
- `POST /api/admin/tenants/:tenantId/modules/:moduleCode` - Install module
- `DELETE /api/admin/tenants/:tenantId/modules/:moduleCode` - Uninstall module

## Technology Stack

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Custom components + GlassCard from shared UI library
- **State Management**: React hooks (useState, useEffect)
- **Data Fetching**: Native Fetch API

## Key Components

### Layout
- Fixed sidebar navigation with dashboard, tenants, and modules sections
- Responsive design with mobile sidebar toggle
- Platform admin header with breadcrumbs
- User info display

### Dashboard Cards
- Statistical overview cards with icons
- Glassmorphism design for visual appeal
- Interactive charts showing growth trends
- Recent activity timeline

### Tenants Table
- Sortable and filterable data table
- Search functionality
- Status badges (active, inactive, suspended)
- Storage and user metrics
- Create tenant modal

### Module Grid
- Card-based grid layout
- Category filtering
- Installation statistics
- Detailed modal view with features and dependencies

## Styling

The panel uses Tailwind CSS with a glassmorphism design system:

- **Colors**: Blue primary (#2B579A), semantic status colors
- **Components**: Glass cards with backdrop blur and transparency
- **Typography**: Clean, modern sans-serif fonts
- **Spacing**: Consistent 8px grid system
- **Animations**: Smooth transitions and hover effects

## Usage

### Development

```bash
# Start the development server
cd apps/web
npm run dev
```

### Access the Platform Admin Panel

Navigate to `/dashboard` to access the platform administration interface.

### Creating a New Tenant

1. Go to `/tenants`
2. Click "Create Tenant" button
3. Fill in organization details:
   - Organization name
   - Subdomain (will be `subdomain.dockpulse.com`)
   - Admin name and email
4. Submit the form

### Installing Modules

1. Navigate to a tenant detail page (`/tenants/:id`)
2. Use the "Install Module" dropdown in the Installed Modules section
3. Select a module from the available options
4. Confirm installation

### Browsing Module Catalog

1. Go to `/modules`
2. Use search or category filters
3. Click on any module card to view details
4. See features, dependencies, and installation statistics

## API Configuration

The API base URL is configured in `/lib/platform-admin/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3003/api/admin';
```

To change the backend URL, update this constant.

## Responsive Design

The panel is fully responsive:

- **Desktop**: Full sidebar, multi-column layouts
- **Tablet**: Collapsible sidebar, 2-column grids
- **Mobile**: Hamburger menu, single-column layout, stacked cards

## Error Handling

All API calls include comprehensive error handling:

- Network errors are caught and displayed
- Failed requests show error messages
- Retry functionality on errors
- Loading states during async operations

## Future Enhancements

Potential improvements:

1. **Authentication**: Add proper auth guard with role-based access
2. **Real-time Updates**: WebSocket integration for live stats
3. **Advanced Filtering**: More filter options and saved filters
4. **Bulk Operations**: Multi-select for bulk tenant/module actions
5. **Export**: Download reports and data exports
6. **Audit Logs**: Detailed activity logging and history
7. **Settings**: Platform configuration panel
8. **Notifications**: Toast notifications for actions
9. **Charts**: More detailed analytics with chart libraries
10. **Dark Mode**: Theme toggle support

## Support

For issues or questions, contact the DockPulse development team.
