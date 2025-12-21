import { CustomerType } from '@prisma/client';

/**
 * Days of the week for delivery schedule
 */
export const DELIVERY_DAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

/**
 * Customer types with descriptions
 */
export const CUSTOMER_TYPES = [
  {
    value: CustomerType.RESIDENTIAL,
    label: 'Residential',
    description: 'Home/Apartment customers',
    icon: '🏠',
  },
  {
    value: CustomerType.COMMERCIAL,
    label: 'Commercial',
    description: 'Office/Shop customers',
    icon: '🏢',
  },
  {
    value: CustomerType.CORPORATE,
    label: 'Corporate',
    description: 'Large factories/enterprises',
    icon: '🏭',
  },
] as const;

/**
 * Form step titles and descriptions
 */
export const FORM_STEPS = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Customer name, phone, and legacy code',
  },
  {
    id: 2,
    title: 'Location Details',
    description: 'Address and map coordinates',
  },
  {
    id: 3,
    title: 'Schedule & Pricing',
    description: 'Delivery days and credit limits',
  },
  {
    id: 4,
    title: 'Legacy Migration',
    description: 'Opening balances (optional)',
  },
] as const;

/**
 * Default form values
 */
export const DEFAULT_FORM_VALUES = {
  // Basic Info
  name: '',
  phoneNumber: '',
  email: '',
  password: '',
  manualCode: '',

  // Location
  area: '',
  address: '',
  landmark: '',
  floorNumber: 0,
  hasLift: false,
  geoLat: null,
  geoLng: null,

  // Routing
  routeId: null,
  sequenceOrder: null,

  // Business
  type: CustomerType.RESIDENTIAL,
  deliveryDays: [],
  creditLimit: '2000',

  // Legacy Migration
  openingCashBalance: '0',
  openingBottleBalance: 0,
  productId: null,
} as const;
