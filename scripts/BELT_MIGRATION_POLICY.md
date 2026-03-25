# Belt Migration Policy

## Critical Rule

**NEVER delete `StudentBeltHistory` records as part of belt-level migration.**

Student belt history is user data. Deleting it causes permanent data loss.

## Supported Approach

The only supported approach for belt-level updates is the **safe remapping** strategy:

1. **Create** new belt levels if they don't exist
2. **Update** `orderNumber` on existing belts
3. **Remap** `StudentBeltHistory` from old belt IDs to new (by name mapping)
4. **Delete** only orphan `BeltLevel` rows that have zero history references

## Implementation

Use `scripts/migrate-belt-levels.ts` as the reference. It:

- Preserves all `StudentBeltHistory` records
- Maps old belt names (e.g. White, Yellow) to new Hebrew names (e.g. קיו 1, קיו 2)
- Updates history to point to new belt levels before removing old ones

## Forbidden

- `prisma.studentBeltHistory.deleteMany()`
- Any migration that deletes belt history to "clear the way" for belt changes

## Adding New Belt Mappings

When extending the belt list, update `getOldToNewBeltMapping()` in the migration script to include any old belt names that need to map to new ones.
