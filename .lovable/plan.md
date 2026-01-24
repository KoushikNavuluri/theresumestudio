
# Admin Panel for Promo Code Management

This plan implements a secure admin panel to manage promo codes with full CRUD operations and redemption statistics. The implementation follows security best practices by using a separate `user_roles` table and server-side role validation.

## Architecture Overview

```text
+------------------+     +-------------------+     +------------------+
|   Admin Panel    |---->| Admin Edge        |---->| Supabase DB      |
|   /admin         |     | Functions         |     | (RLS Protected)  |
+------------------+     +-------------------+     +------------------+
        |                       |                        |
        |                       v                        |
        |              +-------------------+             |
        |              | has_role() check  |<------------+
        |              | SECURITY DEFINER  |
        +------------->+-------------------+
```

## Database Changes

### 1. User Roles System
Create a secure role management system with privilege escalation protection:

- **New enum**: `app_role` with values `admin`, `moderator`, `user`
- **New table**: `user_roles` with columns:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `role` (app_role enum)
  - Unique constraint on (user_id, role)
- **Security function**: `has_role(user_id, role)` using `SECURITY DEFINER` to bypass RLS and prevent recursive policy checks
- **RLS policies**: Only admins can view/modify roles

### 2. Bonus Codes Table Updates
Add RLS policies so admins can manage all promo codes:
- SELECT policy for admins
- INSERT policy for admins
- UPDATE policy for admins
- DELETE policy for admins

### 3. Redeemed Codes Access
Add admin SELECT policy to view all redemption history for statistics.

## Edge Functions

### `admin-promo-codes` Edge Function
Secure endpoint for all admin promo code operations:

**Endpoints/Actions:**
- `list` - Get all promo codes with redemption counts
- `create` - Create new promo code
- `update` - Update existing promo code
- `deactivate` - Soft-delete (set is_active = false)
- `stats` - Get detailed redemption statistics

**Security:**
- Validates JWT authentication
- Calls `has_role()` function to verify admin status server-side
- Uses service role key for database operations
- Input validation for all fields

## Frontend Components

### 1. Admin Page (`src/pages/Admin.tsx`)
Protected admin dashboard with:
- Route at `/admin`
- Access check on mount (redirects non-admins)
- Tabbed interface for different sections

### 2. Promo Code Management Section
**Features:**
- Data table showing all promo codes
- Columns: Code, Credits, Uses/Max, Status, Expires, Actions
- Create new code button with form dialog
- Edit code inline or via dialog
- Deactivate/Reactivate toggle
- Delete confirmation

### 3. Redemption Statistics Section
**Features:**
- Total redemptions count
- Credits distributed
- Most popular codes chart
- Recent redemptions list with user info
- Filter by date range

### 4. Admin Hook (`src/hooks/useAdmin.ts`)
Custom hook for admin operations:
- `isAdmin` - boolean state
- `checkAdminStatus()` - validates role via edge function
- `loading` - loading state

## UI Components Needed

### PromoCodeTable Component
- Uses shadcn Table component
- Sortable columns
- Pagination
- Status badges (Active/Inactive/Expired)

### CreatePromoCodeDialog Component
- Form with fields: Code, Credits, Max Uses, Expiry Date
- Validation with zod
- Loading states

### PromoCodeStats Component
- Summary cards with key metrics
- Recharts bar chart for popular codes
- Recent activity feed

## Navigation Updates

### BottomNav Conditional Admin Link
- Only visible to users with admin role
- Shield icon with "Admin" label

## File Structure

```text
src/
  pages/
    Admin.tsx                    # Main admin page
  components/
    admin/
      PromoCodeTable.tsx         # Promo codes data table
      CreatePromoCodeDialog.tsx  # Create/edit dialog
      PromoCodeStats.tsx         # Statistics dashboard
      AdminGuard.tsx             # Route protection wrapper
  hooks/
    useAdmin.ts                  # Admin state and operations

supabase/
  functions/
    admin-promo-codes/
      index.ts                   # Admin edge function
  migrations/
    [timestamp]_admin_roles.sql  # Database migration
```

## Security Considerations

1. **Role Storage**: Roles stored in separate `user_roles` table, not in profiles
2. **Server-side Validation**: Admin status checked in edge function using `has_role()`, never trusting client
3. **SECURITY DEFINER**: The `has_role()` function uses SECURITY DEFINER to safely bypass RLS
4. **Service Role Key**: Edge function uses service role key for admin operations
5. **Input Validation**: All inputs validated and sanitized
6. **Audit Trail**: Redemptions tracked with timestamps and user IDs

## Implementation Steps

1. **Database Migration**
   - Create `app_role` enum
   - Create `user_roles` table with RLS
   - Create `has_role()` function
   - Add admin RLS policies to `bonus_codes` and `redeemed_codes`

2. **Edge Function**
   - Create `admin-promo-codes` function
   - Implement role validation
   - Add CRUD operations
   - Add statistics queries

3. **Frontend Hook**
   - Create `useAdmin` hook
   - Implement admin status check

4. **Admin Page**
   - Create page with tabs
   - Build promo code table
   - Build create/edit dialog
   - Build statistics dashboard

5. **Navigation**
   - Add conditional admin link to BottomNav

6. **Testing**
   - Manually assign admin role to test user
   - Verify non-admins cannot access

## Technical Details

### Promo Code Form Fields
| Field | Type | Validation |
|-------|------|------------|
| code | string | Required, uppercase, 3-20 chars, alphanumeric |
| credits | number | Required, min: 1, max: 10000 |
| max_uses | number | Optional, min: 1, default: 1 |
| expires_at | date | Optional, must be future date |

### Statistics Queries
- Total codes: COUNT from bonus_codes
- Total redemptions: SUM(uses) from bonus_codes
- Credits distributed: SUM(credits_awarded) from redeemed_codes
- Top codes: GROUP BY bonus_code_id with redemption counts
- Recent activity: Latest 20 redemptions with user emails

### Initial Admin Setup
After migration, you will need to manually insert your user ID into the `user_roles` table to grant yourself admin access. This is a one-time setup done via Supabase SQL Editor.
