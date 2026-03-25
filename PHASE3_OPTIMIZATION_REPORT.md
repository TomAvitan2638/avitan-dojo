# Phase 3: Server-Side Search & Selector Optimization – Report

## 1. Files Changed

### Students (server-side search)
- `src/app/(dashboard)/dashboard/students/page.tsx` – `search` param, `buildStudentsWhere`, Prisma `OR` for identifier/name/center/group
- `src/app/(dashboard)/dashboard/students/students-page-client.tsx` – form-based search, `initialSearch` prop, pagination preserves search, removed client-side filtering

### Payments (server-side search)
- `src/app/(dashboard)/dashboard/payments/page.tsx` – `search`, `filterType`, `filterSubtype` params, label-to-enum mapping, Prisma `where` for snapshots + type + subtype
- `src/app/(dashboard)/dashboard/payments/payments-page-client.tsx` – form-based search, filter dropdowns via URL, pagination preserves search/filters, removed client-side filtering

### Payments (student selector optimization)
- `src/app/(dashboard)/dashboard/payments/page.tsx` – removed `prisma.student.findMany` from initial `Promise.all`
- `src/app/(dashboard)/dashboard/payments/payments-page-client.tsx` – deferred student loading, `selectorStudents`, `selectorStudentsLoading`, `useEffect` to fetch when dialog opens
- `src/server/actions/get-students-for-payment-selector.ts` – **new** server action to load students for the payment selector

---

## 2. Pages Using Server-Side Search

| Page     | Route                  | Server-side search |
|----------|------------------------|--------------------|
| Students | `/dashboard/students`  | Yes                |
| Payments | `/dashboard/payments`  | Yes                |

---

## 3. Search via `searchParams` / URL

### Students
- `?search=...` – text query
- `?page=...` – page number
- Form: `action="/dashboard/students" method="get"`, `name="search"`, hidden `page=1` to reset on new search
- Pagination links add `&search=${encodeURIComponent(initialSearch)}` when present

### Payments
- `?search=...` – text query (snapshots, type/subtype labels)
- `?filterType=...` – `MONTHLY` | `EQUIPMENT` | `EXAM` or empty
- `?filterSubtype=...` – `REGULAR` | `CHECK` | `WAIVER` when `filterType=MONTHLY`
- `?page=...` – page number
- Form: `action="/dashboard/payments" method="get"`, hidden `page`, `filterType`, `filterSubtype`
- Filter dropdowns: `onChange` → `router.push` with new params and `page=1`
- Pagination links add all active search/filter params

---

## 4. Pagination with Search

- **Students:** `whereClause` includes search; `prisma.student.count` uses same `where`; `skip`/`take` on filtered results; `safePage` when page exceeds `totalPages`
- **Payments:** Same pattern with `prisma.payment.count` and combined search/filter `where`
- Pagination controls keep `search`, `filterType`, `filterSubtype` in links
- New search/filter resets to page 1 (via form hidden input or filter `router.push`)

---

## 5. Selector / Dropdown Bottlenecks Addressed

### Payments create dialog – student selector
- **Before:** All students loaded on page load via `prisma.student.findMany` in the same `Promise.all` as payments
- **After:** Students are **not** loaded on page load
- Students are fetched on demand when the create-payment dialog opens (useEffect with `createOpen`)
- Server action `getStudentsForPaymentSelector` returns minimal fields: id, identifier, name, hasActiveMembership, centerName, groupName
- Loading state: "טוען תלמידים..." in the selector until data arrives
- Cached for the session (no refetch when dialog is reopened)

---

## 6. Data Load Reduced in Payments Create

- Removed: `prisma.student.findMany` from the initial payments page query
- Initial page load: no student query; only payments (paginated), count, sports equipment, exams
- Student list: loaded only when the create dialog is opened, via a separate server action

---

## 7. Limitations

### Search / sort
- **Sort remains client-side** on both pages (current page only)
- **Amount search removed** from Payments – no longer searchable by exact amount (was client-side); snapshot text + type/subtype labels are searchable

### Hebrew labels
- Payment type and monthly subtype search uses a server-side Hebrew-to-enum map (e.g. "חודשי" → `MONTHLY`)
- Partial Hebrew text must match the label to hit the correct enum; exact matching is based on `contains`

### Student selector
- List is fetched once per dialog-open and cached for the session
- New students added in another tab may not appear until full page refresh

---

## 8. Expected Performance Impact

| Area                    | Before                         | After                                             |
|-------------------------|--------------------------------|---------------------------------------------------|
| Students search         | Client-side over current page  | Server-side over full dataset                     |
| Payments search         | Client-side over current page  | Server-side over full dataset                     |
| Payments filters        | Client-side                    | Server-side                                      |
| Payments initial load   | Payments + all students + ...  | Payments + count + equipment + exams (no students) |
| Create payment dialog   | Uses preloaded students        | Loads students when dialog opens                  |
| Pagination with search  | N/A (page-only)                | Correct page count and navigation across results |

- Faster initial load on Payments: no large student list
- Search works across the full dataset, not only the current page
- `count` and `findMany` share the same filter, so pagination and totals stay consistent
