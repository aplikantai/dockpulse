# Modul @branches - Specyfikacja

## 1. Cel modulu

Modul @branches umozliwia zarzadzanie wieloma oddzialami/filiami firmy w ramach jednego tenanta.
Kazdy oddzial moze miec przypisanych uzytkownikow, zamowienia, klientow.

## 2. Model danych (Prisma)

```prisma
model Branch {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Identyfikacja
  code        String   // GOR, MAS, SZC
  name        String   // Gorzow, Maszewo, Szczecin

  // Dane kontaktowe
  address     String?
  city        String?
  postalCode  String?
  phone       String?
  email       String?

  // Status
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)

  // Metadane
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacje
  users       UserBranch[]
  orders      Order[]
  postalPrefixes BranchPostalPrefix[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@map("branches")
}

model UserBranch {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  branchId   String
  branch     Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  assignedAt DateTime @default(now())

  @@unique([userId, branchId])
  @@index([userId])
  @@index([branchId])
  @@map("user_branches")
}

model BranchPostalPrefix {
  id          String   @id @default(uuid())
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  prefix      String   // "66-40", "70-", "71-"
  description String?  // "Gorzow i okolice"
  createdAt   DateTime @default(now())

  @@unique([branchId, prefix])
  @@index([branchId])
  @@map("branch_postal_prefixes")
}
```

## 3. Endpointy API

### Branches CRUD
- GET    /api/branches           - Lista oddzialow
- GET    /api/branches/:id       - Szczegoly oddzialu
- POST   /api/branches           - Utworz oddzial
- PATCH  /api/branches/:id       - Aktualizuj oddzial
- DELETE /api/branches/:id       - Usun oddzial

### User-Branch assignments
- GET    /api/branches/:id/users          - Uzytkownicy oddzialu
- POST   /api/branches/:id/users/:userId  - Przypisz uzytkownika
- DELETE /api/branches/:id/users/:userId  - Odlacz uzytkownika

### Postal prefixes
- GET    /api/branches/:id/postal-prefixes       - Prefiksy kodow
- POST   /api/branches/:id/postal-prefixes       - Dodaj prefiks
- DELETE /api/branches/:id/postal-prefixes/:prefixId - Usun prefiks

### Auto-assign
- GET    /api/branches/by-postal-code/:code      - Znajdz oddzial po kodzie

## 4. DTO (Zod)

```typescript
// CreateBranchDto
const createBranchSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(2).max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isDefault: z.boolean().optional(),
});

// UpdateBranchDto
const updateBranchSchema = createBranchSchema.partial();

// AssignUserDto
const assignUserSchema = z.object({
  userId: z.string().uuid(),
});

// PostalPrefixDto
const postalPrefixSchema = z.object({
  prefix: z.string().min(2).max(10),
  description: z.string().optional(),
});
```

## 5. Uprawnienia

| Akcja | OWNER | ADMIN | MANAGER | EMPLOYEE |
|-------|-------|-------|---------|----------|
| branches:list | Y | Y | Y (own) | Y (own) |
| branches:read | Y | Y | Y (own) | Y (own) |
| branches:create | Y | Y | N | N |
| branches:update | Y | Y | N | N |
| branches:delete | Y | N | N | N |
| branches:assign-users | Y | Y | N | N |

## 6. Eventy

```typescript
// Event types
'branch.created'
'branch.updated'
'branch.deleted'
'branch.user.assigned'
'branch.user.unassigned'
```

## 7. Integracje

### Z modulem @orders
- Order.branchId -> Branch.id
- Auto-assign branch na podstawie kodu pocztowego klienta

### Z modulem @users
- User moze nalezec do wielu oddzialow
- Filtrowanie danych po branchId

### Z modulem @customers
- Customer moze byc przypisany do oddzialu (opcjonalnie)

## 8. Konfiguracja modulu

```typescript
interface BranchesModuleConfig {
  autoAssignByPostalCode: boolean;  // Automatyczne przypisanie po kodzie
  requireBranchForOrders: boolean;  // Czy zamowienie musi miec branchId
  defaultBranchId?: string;         // Domyslny oddzial
}
```

## 9. Migracja z tapparella

```sql
-- Eksport z tapparella
SELECT id, code, name, address, city, postal_code, phone, email, is_active
FROM branches;

-- Import do dockpulse
INSERT INTO branches (id, tenant_id, code, name, ...)
SELECT id, 'TENANT_ID', code, name, ...
FROM temp_tapparella_branches;
```
