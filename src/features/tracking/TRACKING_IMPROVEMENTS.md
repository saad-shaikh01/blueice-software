# Live Tracking - Mission Control Refactor

## Overview

The Live Tracking feature has been transformed into a "Mission Control" style dashboard that provides comprehensive real-time monitoring of all drivers without manual map navigation.

## What's New

### 1. Driver Sidebar (Mission Control Panel)

**Location:** `src/features/tracking/components/driver-sidebar.tsx`

A collapsible left sidebar that displays all drivers in a searchable, filterable list.

**Features:**

- **Search:** Find drivers by name, phone number, or vehicle number
- **Filters:**
  - All Drivers
  - On Duty Only
  - Off Duty Only
  - Moving
  - Idle
- **Grouping:** Drivers automatically grouped into "On Duty" and "Off Duty" sections
- **Stats:** Real-time count of total drivers, on-duty drivers
- **Fit All Button:** One-click to view all drivers on the map
- **Collapsible:** Can be collapsed to maximize map space

**Usage:**

```tsx
<DriverSidebar
  drivers={drivers}
  selectedDriverId={selectedDriverId}
  onDriverSelect={(driver) => handleDriverSelect(driver)}
  onFitAllDrivers={() => handleFitAll()}
  isCollapsed={false}
  onToggleCollapse={() => setCollapsed(!collapsed)}
/>
```

### 2. Driver List Item

**Location:** `src/features/tracking/components/driver-list-item.tsx`

Individual driver card component with rich status information.

**Displays:**

- Driver name and phone number
- Duty status badge (On Duty / Off Duty)
- Vehicle number
- Movement status (Moving / Idle) with color indicators
- Battery level with color-coded warnings (green > 50%, yellow > 20%, red ≤ 20%)
- Last update timestamp
- GPS coordinates
- Active pulse indicator for moving drivers

### 3. Enhanced Map Features

**Location:** `src/features/tracking/components/live-map-core.tsx`

#### Map Controller

A custom React component that handles advanced map interactions:

**Auto Fit Bounds:**

- On initial load, the map automatically zooms to show all active drivers
- Respects a max zoom level of 15 to prevent over-zooming
- Uses 50px padding for visual comfort

**Fly-To Animation:**

- When a driver is clicked from the sidebar, the map smoothly flies to that driver
- Animation duration: 800ms with custom easing
- Zooms to level 16 for detailed view
- Automatically opens the driver's popup

**Auto-Open Popup:**

- Selected driver's popup opens automatically
- Popup stays open during map animations

#### Enhanced Marker Icons

**Visual Improvements:**

- **Color Coding:**
  - Green: Moving (on duty)
  - Blue: Idle (on duty)
  - Gray: Off duty
- **Selection Highlight:**
  - Selected driver has an orange border
  - Ripple animation around selected marker
  - Slightly larger size (scale 1.15x)
- **Movement Indicator:**
  - Pulsing green dot for moving drivers
  - Smooth animations

**Bug Fixes:**

- Fixed `isMoving` state not being passed to marker icons (was hardcoded to `false`)
- Now correctly reflects real-time movement status from database

### 4. Updated Data Layer

**Location:** `src/features/tracking/queries.ts`

The `getLiveDriverLocations()` query now fetches additional data:

- `isMoving` - Real-time movement status
- `batteryLevel` - Device battery percentage
- `speed` - Current speed (if available)

This data is retrieved from the most recent `locationHistory` record for each driver.

### 5. Performance Optimizations

**Memoization:**

- Driver statistics (total, on-duty, moving) are memoized to prevent unnecessary recalculations
- Reduces re-renders when driver data updates

**Efficient Updates:**

- React Query polling every 10 seconds
- Optimized marker icon creation with conditional rendering

## Architecture

### Component Hierarchy

```
TrackingPage (page.tsx)
└── LiveMap (live-map.tsx) - Data fetching + state management
    ├── DriverSidebar (driver-sidebar.tsx)
    │   └── DriverListItem (driver-list-item.tsx) [multiple]
    └── LiveMapCore (live-map-core.tsx) - SSR-disabled map
        ├── MapController - Handles fly-to and fit bounds
        └── Marker [multiple] - Individual driver markers
            └── DriverMarkerPopup
```

### State Management

**Local State in LiveMap:**

- `selectedDriverId` - Currently selected driver
- `fitAllTrigger` - Counter to trigger "fit all" action
- `isSidebarCollapsed` - Sidebar visibility state

**React Query:**

- `useLiveLocations()` - Fetches driver data every 10 seconds
- Automatic cache invalidation and background refetching

### Data Flow

1. **User clicks driver in sidebar** → `handleDriverSelect()` → `setSelectedDriverId()` → Map flies to driver
2. **User clicks "Fit All"** → `handleFitAllDrivers()` → `setFitAllTrigger()` → Map fits all markers
3. **User clicks marker on map** → `onDriverSelect()` → Updates `selectedDriverId` → Sidebar item highlights

## Usage Examples

### Basic Usage (with Sidebar)

```tsx
<LiveMap height="100%" showSidebar={true} />
```

### Map Only (no Sidebar)

```tsx
<LiveMap height="600px" showSidebar={false} />
```

### Custom Center and Zoom

```tsx
<LiveMap center={[33.6844, 73.0479]} zoom={12} showSidebar={true} />
```

## Future Enhancements

### 1. Marker Clustering (For 50+ Drivers)

When you have many drivers, implement clustering to prevent map clutter.

**Recommended Library:** `react-leaflet-cluster`

**Installation:**

```bash
npm install react-leaflet-cluster
```

**Implementation (in live-map-core.tsx):**

```tsx
import MarkerClusterGroup from 'react-leaflet-cluster';

// In the MapContainer:
<MapContainer>
  <TileLayer ... />
  <MapController ... />

  <MarkerClusterGroup
    chunkedLoading
    maxClusterRadius={60}
    spiderfyOnMaxZoom={true}
    showCoverageOnHover={false}
    zoomToBoundsOnClick={true}
    iconCreateFunction={(cluster) => {
      const count = cluster.getChildCount();
      const onDutyCount = cluster.getAllChildMarkers().filter(/* check if on duty */);

      return L.divIcon({
        html: `<div class="cluster-icon">
          <div class="cluster-count">${count}</div>
          <div class="cluster-subtext">${onDutyCount} active</div>
        </div>`,
        className: 'custom-cluster-icon',
        iconSize: [50, 50],
      });
    }}
  >
    {drivers.map((driver) => (
      <Marker ... />
    ))}
  </MarkerClusterGroup>
</MapContainer>
```

**Custom Cluster Styling:**

```css
.custom-cluster-icon {
  background-color: rgba(59, 130, 246, 0.8);
  border: 3px solid white;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
```

**Configuration Options:**

- `maxClusterRadius`: 60 (balance between grouping and detail)
- `spiderfyOnMaxZoom`: true (expand overlapping markers at max zoom)
- `showCoverageOnHover`: false (cleaner UX)
- `zoomToBoundsOnClick`: true (zoom to cluster bounds on click)

### 2. WebSocket Integration (Real-Time Updates)

Replace polling with WebSocket for truly real-time updates.

**Server Setup (using Socket.IO):**

Already scaffolded in `src/features/tracking/server/route.ts:55-61`

**Complete Server Implementation:**

```typescript
// In your server entry point (e.g., server.ts)
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_BASE_URL },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available in Hono context
app.use('*', async (ctx, next) => {
  ctx.env.io = io;
  await next();
});
```

**Client Implementation:**

```tsx
// In live-map.tsx
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function LiveMap({ ... }) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket>();

  useEffect(() => {
    // Connect to WebSocket
    const socket = io(process.env.NEXT_PUBLIC_APP_BASE_URL!, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('driver-location-update', (data) => {
      // Update specific driver in React Query cache
      queryClient.setQueryData(['live-locations'], (oldData: any) => {
        if (!oldData) return oldData;

        return oldData.map((driver: any) =>
          driver.driverId === data.driverId
            ? { ...driver, ...data }
            : driver
        );
      });
    });

    socket.on('driver-duty-status-change', (data) => {
      // Handle duty status changes
      queryClient.invalidateQueries(['live-locations']);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // ... rest of component
}
```

**Hybrid Approach (Recommended):**

- Use WebSocket for real-time updates
- Keep polling as fallback (increase interval to 60s)
- Automatically switch to polling if WebSocket fails

```tsx
const { data: drivers } = useLiveLocations({
  enabled: !socketConnected, // Only poll if WebSocket disconnected
  refetchInterval: socketConnected ? false : 60000, // 60s fallback
});
```

### 3. Route Replay & Playback

Add ability to replay a driver's historical route.

**Implementation Ideas:**

- Date/time picker to select replay period
- Playback controls (play, pause, speed)
- Animated marker moving along route path
- Timeline scrubber
- Use existing `getDriverRouteHistory` query

### 4. Geofencing Alerts

Monitor when drivers enter/exit specific areas.

**Features:**

- Draw geofence boundaries on map
- Real-time alerts when driver crosses boundary
- Integration with notifications system

### 5. Driver Heatmap

Visualize driver density and coverage areas.

**Library:** `react-leaflet-heatmap-layer-v3`

**Use Case:** Identify underserved areas or congestion hotspots

## Testing Checklist

- [ ] Sidebar loads with correct driver count
- [ ] Search filters drivers correctly
- [ ] Filter dropdown changes displayed drivers
- [ ] Clicking driver in sidebar flies map to driver
- [ ] Selected driver is highlighted on map with orange border
- [ ] "Fit All Drivers" button shows all drivers in view
- [ ] Map auto-fits on initial load
- [ ] Driver markers show correct colors (green=moving, blue=idle, gray=off-duty)
- [ ] Battery level displays with correct color (green/yellow/red)
- [ ] Moving drivers show pulsing indicator
- [ ] Clicking map marker selects driver in sidebar
- [ ] Off-duty drivers section is collapsible
- [ ] Sidebar collapse/expand works correctly
- [ ] Real-time updates reflect in sidebar and map (every 10s)
- [ ] Error states display correctly
- [ ] Loading states display correctly

## Troubleshooting

### Map doesn't fit all drivers on load

- Check that `drivers` array has data before MapController mounts
- Verify `drivers.length > 0` in initial useEffect

### Fly-to animation doesn't work

- Ensure `selectedDriverId` is updating correctly
- Check that driver exists in `drivers` array
- Verify Leaflet map instance is available via `useMap()`

### Markers don't show movement status

- Verify `isMoving` data is being fetched from `locationHistory`
- Check that drivers are sending location updates with `isMoving` field
- Ensure `createDriverIcon` receives correct `isMoving` value

### Sidebar doesn't update in real-time

- Confirm React Query polling is enabled (`refetchInterval: 10000`)
- Check network tab for API calls every 10s
- Verify `useLiveLocations` hook is being called

## Performance Considerations

- **50+ drivers:** Implement clustering (see section above)
- **100+ drivers:** Add pagination or virtualization to sidebar
- **Real-time updates:** Switch from polling to WebSocket
- **Large route histories:** Implement pagination and lazy loading
- **Mobile devices:** Reduce marker icon complexity, increase refetch interval

## Conclusion

The refactored Live Tracking feature provides a powerful, user-friendly interface for monitoring drivers in real-time. The architecture is designed to scale from 5 drivers to 500+ with minimal changes.

For questions or issues, refer to the codebase or contact the development team.
