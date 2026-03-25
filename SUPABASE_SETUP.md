# Supabase Setup

## Storage (Photos)

### 1. Create Buckets
Create both buckets in Supabase Dashboard → **Storage** → **New bucket**:

| Bucket Name         | Purpose          |
|---------------------|------------------|
| `instructor-photos` | Instructor avatars |
| `student-photos`    | Student photos   |

For each bucket:
1. Name as shown above
2. Enable **Public bucket**
3. Create

### 2. Environment Variables
Add to `.env` (from Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Uploads use the service role key (bypasses RLS). No storage policy needed for MVP.

---

## Database Connection

**P1001: Can't reach database server** – Supabase direct connections use IPv6 by default. Use the **Connection pooler** or enable **IPv4 add-on**.

**Tenant or user not found** – Wrong pooler region/hostname. Get the exact string from your dashboard.

## Option A: Use Connection Pooler (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/dcqykktwjgttjrgqqeqg) → **Settings** → **Database**
2. Under **Connection string**, copy the **Connection pooling** → **Session mode** URI (port 5432)
3. Replace `[YOUR-PASSWORD]` with your database password
4. Paste into `.env` as `DATABASE_URL`
5. Run: `npx prisma migrate dev --name initial_schema`

## Option B: Apply Migration Manually (If connection fails)

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy the contents of `prisma/migrations/20260314144053_initial_schema/migration.sql`
3. Paste and run the SQL
4. Then run: `npx prisma migrate resolve --applied 20260314144053_initial_schema`
5. Run: `npx prisma db seed`
