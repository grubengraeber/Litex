# Remaining Implementation Tasks

## Overview

This document outlines the remaining tasks to be implemented as requested by the user.

## ✅ Completed Tasks

### 1. Files View Page (Task #18) ✓
- ✅ Created /files page with permission-based access
- ✅ Users see only their own files
- ✅ Employees see all files
- ✅ File approval/rejection workflow
- ✅ Added to sidebar navigation

### 2. S3/MinIO Security (Task #19) ✓
- ✅ Shortened presigned URL expiration times (upload: 15min, download: 5min)
- ✅ Added server-side encryption (AES-256)
- ✅ Comprehensive production security documentation
- ✅ Bucket policies and IAM policies documented

## 🔨 Remaining Tasks

### Task #20: Implement Table and Grid Views for Tasks

**Requirements:**
1. Add view toggle button on /tasks page
2. Implement table view using shadcn Table component
3. Keep existing grid view
4. Save user preference in localStorage
5. Make both views responsive

**Implementation Steps:**

1. **Add View Toggle Component** (`src/components/tasks/view-toggle.tsx`):
```typescript
import { LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ViewToggle({ view, onViewChange }: {
  view: "grid" | "table";
  onViewChange: (view: "grid" | "table") => void;
}) {
  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
      >
        <Table className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

2. **Create Table View Component** (`src/components/tasks/tasks-table.tsx`):
- Use shadcn Table component
- Columns: Traffic Light, Status, Booking Text, Company, Period, Amount, Due Date, Actions
- Sortable columns
- Row click to navigate to task details
- Actions dropdown for each row

3. **Update /tasks Page**:
```typescript
const [view, setView] = useState<"grid" | "table">("grid");

useEffect(() => {
  // Load from localStorage
  const saved = localStorage.getItem("tasks-view");
  if (saved === "grid" || saved === "table") {
    setView(saved);
  }
}, []);

const handleViewChange = (newView: "grid" | "table") => {
  setView(newView);
  localStorage.setItem("tasks-view", newView);
};
```

4. **Conditional Rendering**:
```typescript
{view === "grid" ? (
  <TasksGrid tasks={tasks} />
) : (
  <TasksTable tasks={tasks} />
)}
```

---

### Task #21: Add User Disable/Delete Functionality

**Requirements:**
1. Temporarily disable users (status: disabled)
2. Permanently delete users
3. Confirmation dialogs
4. Update /users page with actions

**Implementation Steps:**

1. **Add Disable/Enable Toggle** (in `/users` page):
```typescript
const handleToggleStatus = async (userId: string, currentStatus: string) => {
  const newStatus = currentStatus === "active" ? "disabled" : "active";
  const action = newStatus === "disabled" ? "deaktivieren" : "aktivieren";

  if (!confirm(`Möchten Sie diesen Benutzer ${action}?`)) return;

  const response = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });

  if (response.ok) {
    toast.success(`Benutzer ${action}t`);
    loadUsers();
  }
};
```

2. **Add Delete User**:
```typescript
const handleDelete = async (userId: string, userName: string) => {
  const confirmation = prompt(
    `Um den Benutzer "${userName}" PERMANENT zu löschen, geben Sie "LÖSCHEN" ein:`
  );

  if (confirmation !== "LÖSCHEN") return;

  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });

  if (response.ok) {
    toast.success("Benutzer gelöscht");
    loadUsers();
  }
};
```

3. **Update API Endpoint** (`src/app/api/users/[id]/route.ts`):
```typescript
// Add DELETE method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check permission
  const canDelete = await userHasPermission(
    session.user.id,
    PERMISSIONS.DELETE_USERS
  );

  if (!canDelete) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Sie können sich nicht selbst löschen" },
      { status: 400 }
    );
  }

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}
```

4. **UI Updates in /users Page**:
- Add status badge (active/disabled)
- Add disable/enable button
- Add delete button (red, with warning icon)
- Both actions in dropdown menu

---

### Task #22: Implement Advanced Filters with Query Parameters

**Requirements:**
1. All filters as URL query parameters
2. Status filter (open, submitted, completed)
3. Traffic light filter (green, yellow, red)
4. Company filter
5. Period filter
6. Search query
7. Shareable filter URLs

**Implementation Steps:**

1. **Create Filter Hook** (`src/hooks/use-task-filters.ts`):
```typescript
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

export interface TaskFilters {
  status?: string;
  trafficLight?: string;
  companyId?: string;
  period?: string;
  search?: string;
}

export function useTaskFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters: TaskFilters = {
    status: searchParams.get("status") || undefined,
    trafficLight: searchParams.get("traffic") || undefined,
    companyId: searchParams.get("company") || undefined,
    period: searchParams.get("period") || undefined,
    search: searchParams.get("q") || undefined,
  };

  const updateFilters = useCallback((updates: Partial<TaskFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/tasks?${params.toString()}`);
  }, [searchParams, router]);

  const clearFilters = useCallback(() => {
    router.push("/tasks");
  }, [router]);

  return { filters, updateFilters, clearFilters };
}
```

2. **Create Filter Components**:

**Status Filter** (`src/components/tasks/status-filter.tsx`):
```typescript
export function StatusFilter({ value, onChange }: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? undefined : v)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Alle Status</SelectItem>
        <SelectItem value="open">Offen</SelectItem>
        <SelectItem value="submitted">Eingereicht</SelectItem>
        <SelectItem value="completed">Erledigt</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

**Traffic Light Filter**, **Company Filter**, **Period Filter** - Similar pattern

3. **Update /tasks Page**:
```typescript
import { useTaskFilters } from "@/hooks/use-task-filters";

export default function TasksPage() {
  const { filters, updateFilters, clearFilters } = useTaskFilters();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, [filters]); // Reload when filters change

  const loadTasks = async () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.trafficLight) params.set("trafficLight", filters.trafficLight);
    if (filters.companyId) params.set("companyId", filters.companyId);
    if (filters.period) params.set("period", filters.period);
    if (filters.search) params.set("search", filters.search);

    const response = await fetch(`/api/tasks?${params.toString()}`);
    const { tasks } = await response.json();
    setTasks(tasks);
  };

  return (
    <div>
      {/* Filters Bar */}
      <div className="flex items-center gap-2 mb-4">
        <StatusFilter
          value={filters.status}
          onChange={(v) => updateFilters({ status: v })}
        />
        <TrafficLightFilter
          value={filters.trafficLight}
          onChange={(v) => updateFilters({ trafficLight: v })}
        />
        <CompanyFilter
          value={filters.companyId}
          onChange={(v) => updateFilters({ companyId: v })}
        />
        <PeriodFilter
          value={filters.period}
          onChange={(v) => updateFilters({ period: v })}
        />
        <SearchInput
          value={filters.search}
          onChange={(v) => updateFilters({ search: v })}
        />
        {Object.values(filters).some(Boolean) && (
          <Button variant="outline" onClick={clearFilters}>
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Tasks View */}
      {/* ... */}
    </div>
  );
}
```

4. **Update API Endpoint** (`src/app/api/tasks/route.ts`):
- Already supports filters via `TaskFilters` interface
- Just ensure all query params are parsed correctly

5. **Add Active Filter Indicators**:
```typescript
const activeFilterCount = Object.values(filters).filter(Boolean).length;

{activeFilterCount > 0 && (
  <Badge variant="secondary">
    {activeFilterCount} Filter aktiv
  </Badge>
)}
```

6. **Shareable URLs**:
Users can now copy the URL to share filtered views:
```
https://litex.example.com/tasks?status=open&traffic=red&company=xyz&period=2024-12
```

---

## Implementation Priority

1. **Task #22 (Advanced Filters)** - Highest priority
   - Most impactful for user experience
   - Enables power users to work efficiently

2. **Task #20 (Table/Grid Views)** - High priority
   - Improves task management
   - Different users prefer different views

3. **Task #21 (User Management)** - Medium priority
   - Important for admin functionality
   - Less frequently used

## Testing Checklist

### After Implementing Filters:
- [ ] All filters work individually
- [ ] Multiple filters work together
- [ ] URL updates when filters change
- [ ] Filters persist on page reload
- [ ] Clear filters button works
- [ ] Filter count badge is accurate
- [ ] Shareable URLs work correctly

### After Implementing Views:
- [ ] Toggle between grid and table works
- [ ] Preference persists in localStorage
- [ ] Both views are responsive
- [ ] Table columns are sortable
- [ ] Grid cards display correctly

### After Implementing User Management:
- [ ] Can disable user
- [ ] Can enable user
- [ ] Can delete user
- [ ] Confirmation dialogs work
- [ ] Cannot delete self
- [ ] Permission checks work

## Notes

- All changes should maintain existing functionality
- Follow existing code patterns and conventions
- Update TypeScript types as needed
- Add appropriate error handling
- Test with different user roles (customer, employee, admin)
