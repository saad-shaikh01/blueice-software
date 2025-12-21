# Customer Creation UI - Implementation Guide

## 🎨 Overview

A professional, multi-step form for creating customers with support for legacy data migration. Built with Shadcn/UI components, React Hook Form, and TanStack Query.

## 📁 Component Structure

```
src/features/customers/components/
├── create-customer-form.tsx      # Main multi-step form with stepper
├── basic-info-step.tsx            # Step 1: Name, phone, password, manual code
├── location-step.tsx              # Step 2: Address, GPS coordinates
├── schedule-pricing-step.tsx      # Step 3: Delivery days, customer type, credit limit
├── legacy-migration-step.tsx      # Step 4: Opening balances for migration
└── index.ts                       # Barrel exports
```

## 🚀 Usage

### Quick Start

Create a new page in your app:

```typescript
// app/(dashboard)/customers/new/page.tsx
import { CreateCustomerForm } from '@/features/customers/components';

export default function NewCustomerPage() {
  return (
    <div className="container py-8">
      <CreateCustomerForm />
    </div>
  );
}
```

### Add to Navigation

```typescript
// In your navigation component
<Link href="/customers/new">
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Add Customer
  </Button>
</Link>
```

## ✨ Features

### 1. **Multi-Step Wizard**
- **4 Steps** with visual progress indicator
- **Step validation** before proceeding
- **Navigate backwards** to edit previous steps
- **Responsive stepper** design

### 2. **Step 1: Basic Information**
- Full name (required)
- Phone number with validation (min 10 digits)
- Email (optional)
- Password (min 8 characters)
- **Manual Code** in highlighted section for legacy customers

### 3. **Step 2: Location Details**
- Area/locality for route grouping
- Full address
- Optional landmark
- Floor number and lift availability
- GPS coordinates (lat/lng)
- **Ready for Google Maps integration**

### 4. **Step 3: Schedule & Pricing**
- **Interactive customer type selector** with icons:
  - 🏠 Residential
  - 🏢 Commercial
  - 🏭 Corporate
- **Visual day selector** - click to toggle delivery days
- Shows selected days as badges
- Credit limit configuration

### 5. **Step 4: Legacy Migration**
- **Opening cash balance** (positive = advance, negative = debt)
- **Opening bottle balance** with product selection
- **Visual indicators** for migration status:
  - Green for advance payments
  - Red for outstanding debt
  - Blue for bottle holdings
- **Migration summary** showing what will be created

### 6. **UX Enhancements**
- ✅ Real-time validation feedback
- ✅ Loading states during submission
- ✅ Success/error toast notifications
- ✅ Optimistic UI updates
- ✅ Dark mode support
- ✅ Responsive design (mobile-friendly)
- ✅ Keyboard navigation
- ✅ Development debug panel (auto-removed in production)

## 🎨 Design Highlights

### Color-Coded Sections
- **Blue** - Legacy customer code (informational)
- **Green** - GPS coordinates (optional feature)
- **Orange** - Migration transaction preview
- **Purple** - Migration data section header

### Interactive Elements
- **Day selector buttons** - Change color when selected
- **Customer type cards** - Show description on hover
- **Progress bar** - Smooth transitions between steps
- **Stepper circles** - Clickable for completed steps

## 📋 Form Validation

### Built-in Validations
| Field | Validation |
|-------|-----------|
| Name | Required, min 1 character |
| Phone | Required, min 10 digits |
| Email | Valid email format or empty |
| Password | Min 8 characters |
| Manual Code | Format: `L-XXXX` (e.g., L-3442) |
| Delivery Days | At least 1 day, no duplicates |
| Floor Number | Non-negative integer |
| GPS Coordinates | Valid lat/lng ranges |
| Credit Limit | Positive number |
| Opening Balances | Valid decimal/integer |
| Product ID | Required if bottle balance > 0 |

### Custom Business Rules
- **Manual code** format validation with regex
- **Delivery days** uniqueness check
- **Product required** when bottle balance > 0
- **Decimal precision** for financial fields

## 🔧 Customization

### Change Redirect After Creation

```typescript
// In create-customer-form.tsx
createCustomer(data, {
  onSuccess: () => {
    form.reset();
    router.push('/your-custom-path'); // Change this
  },
});
```

### Add Additional Steps

1. Create new step component
2. Add to `FORM_STEPS` in constants
3. Update `renderStep()` in `create-customer-form.tsx`
4. Add fields to `getStepFields()` for validation

### Customize Default Values

```typescript
// In constants.ts
export const DEFAULT_FORM_VALUES = {
  creditLimit: '5000', // Change default credit limit
  type: CustomerType.COMMERCIAL, // Change default type
  // ... etc
};
```

## 🎯 Integration Checklist

### Before Using in Production

- [ ] **Run database migration**
  ```bash
  npx prisma migrate dev --name add_customer_onboarding_fields
  npx prisma generate
  ```

- [ ] **Create products API endpoint** (or use mock data)
  - Update `use-get-products.ts` when ready

- [ ] **Set up routing**
  - Create `/customers/new` page
  - Update redirect path after creation
  - Add navigation links

- [ ] **Test all validations**
  - Try submitting invalid data
  - Test migration scenarios
  - Verify error messages

- [ ] **Google Maps Integration** (optional)
  - Add Google Maps API key
  - Implement map picker component
  - Auto-fill lat/lng on map click

- [ ] **Permissions**
  - Restrict access to SUPER_ADMIN, ADMIN, INVENTORY_MGR
  - Add authorization checks in your route/layout

## 🚨 Important Notes

### Migration Data (Step 4)
- **Only for existing customers** from legacy system
- Leave at zero for new signups
- System will create:
  - Ledger entry if cash balance > 0
  - Bottle wallet entry if bottle balance > 0
  - All in a single atomic transaction

### Manual Code Format
- Must match pattern: `L-XXXX`
- Examples: `L-3442`, `L-0001`, `L-9999`
- Case-sensitive (uppercase L)
- Used for tracking legacy customers

### Delivery Days
- 0 = Sunday, 1 = Monday, ... 6 = Saturday
- Select at least one day
- No duplicates allowed
- Stored as array of integers

## 🎨 UI Components Used

- ✅ `Card` - Section containers
- ✅ `Input` - Text fields
- ✅ `Button` - Actions
- ✅ `Select` - Dropdowns
- ✅ `Switch` - Toggle (lift availability)
- ✅ `Badge` - Selected days display
- ✅ `Alert` - Informational messages
- ✅ `Form` - React Hook Form integration
- ✅ `Separator` - Visual dividers

## 📱 Responsive Behavior

### Desktop (>= 768px)
- Two-column grids for related fields
- Full stepper with descriptions
- Side-by-side navigation

### Mobile (< 768px)
- Single-column layout
- Compact stepper (numbers only)
- Stacked navigation buttons

## 🐛 Troubleshooting

### Form not submitting?
- Check browser console for validation errors
- Verify all required fields are filled
- Ensure delivery days are selected
- If bottle balance > 0, product must be selected

### Products not loading?
- Update `use-get-products.ts` with actual API endpoint
- Check if products API is implemented
- Verify authentication tokens

### Navigation not working?
- Install `next/navigation` if missing
- Update redirect path to match your routing
- Check if router is available

## 🎉 Next Steps

1. **Test the form** - Create a few test customers
2. **Customize styling** - Match your brand colors
3. **Add Google Maps** - Enhance location picker
4. **Build customer list** - View created customers
5. **Add edit functionality** - Update existing customers

## 💡 Pro Tips

- Use the **development debug panel** to inspect form state
- Click on **completed steps** to go back and edit
- The form remembers your inputs if you navigate between steps
- **Legacy section clearly labeled** so users know it's for migration
- All financial inputs show **visual feedback** (green/red) for clarity

---

**Built with ❤️ for professional Water ERP systems**
