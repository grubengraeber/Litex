# Audit Logging System

This directory contains the audit logging infrastructure for tracking all significant actions across the system.

## Architecture

The audit logging system uses a **wrapper-based approach** instead of manual logging in each route. This keeps API routes clean and ensures comprehensive logging.

## Quick Start

### Simple Auto-Logging

For basic CRUD operations, just wrap your route handler:

```typescript
import { withAuditLog } from "@/lib/audit/withAuditLog";

export const POST = withAuditLog(async (req) => {
  // Your route logic
  const data = await req.json();
  const result = await createSomething(data);
  return NextResponse.json(result, { status: 201 });
}, {
  auto: true,  // Automatically detects action based on HTTP method
  entityType: "task"  // What type of entity is being operated on
});
```

### With Before/After State Tracking

For updates and deletes where you want to track changes:

```typescript
import { withDetailedAuditLog } from "@/lib/audit/withAuditLog";

export const PATCH = withDetailedAuditLog(async (req) => {
  const id = req.nextUrl.searchParams.get("id");
  const data = await req.json();
  const updated = await updateSomething(id, data);
  return NextResponse.json(updated);
}, {
  auto: true,
  entityType: "company",
  getEntityId: (req) => req.nextUrl.searchParams.get("id") || undefined,
  getBeforeState: async (req) => {
    const id = req.nextUrl.searchParams.get("id");
    return await getSomethingById(id);
  },
  getAfterState: async (response) => {
    const data = await response.clone().json();
    return data.company;
  },
});
```

## How It Works

### Automatic Action Detection

Based on HTTP method:
- `GET` → `READ`
- `POST` → `CREATE`
- `PUT/PATCH` → `UPDATE`
- `DELETE` → `DELETE`

### Entity Type Detection

If not provided, automatically extracts from URL path:
- `/api/tasks/123` → `"task"`
- `/api/companies/456` → `"company"`

### What Gets Logged

Every audit log entry includes:
- **Action**: What happened (CREATE, READ, UPDATE, DELETE, etc.)
- **Entity Type**: What was affected (task, user, company, etc.)
- **Entity ID**: Specific record that was affected
- **User Info**: Who did it (ID, email)
- **Request Info**: IP address, user agent
- **Metadata**: Path, HTTP method, response status, duration
- **Changes**: Before/after state (for detailed logging)
- **Status**: Success, failed, or error
- **Timestamp**: When it happened

## Configuration Options

### Basic Options

```typescript
{
  auto: true,              // Auto-detect action from HTTP method
  action: "APPROVE",       // Or specify custom action
  entityType: "task",      // Entity being operated on
  skip: (req) => false,    // Conditionally skip logging
}
```

### Advanced Options

```typescript
{
  getEntityId: (req, params) => {
    // Extract entity ID from request
    return params?.id || req.nextUrl.searchParams.get("id");
  },

  getMetadata: (req, response) => {
    // Add custom metadata
    return {
      userRole: req.headers.get("x-user-role"),
      responseSize: response.headers.get("content-length"),
    };
  },
}
```

### Detailed Tracking Options

```typescript
{
  getBeforeState: async (req, params) => {
    // Fetch state before operation
    return await db.select().from(table).where(eq(table.id, params.id));
  },

  getAfterState: async (response) => {
    // Extract state from response
    const data = await response.clone().json();
    return data.result;
  },
}
```

## Viewing Audit Logs

Navigate to `/audit-logs` to view all logged actions. You can filter by:
- Action type
- Entity type
- Status (success/failed/error)
- Date range

Only users with the `VIEW_AUDIT_LOGS` permission can access the audit logs page.

## Files

- **`audit-service.ts`**: Core audit logging functions and database operations
- **`audit-middleware.ts`**: Legacy manual logging helpers (being phased out)
- **`withAuditLog.ts`**: Modern wrapper-based approach (use this!)

## Best Practices

1. **Always use wrappers** - Don't manually call audit logging in route handlers
2. **Use `withDetailedAuditLog`** for UPDATE and DELETE operations to track changes
3. **Keep metadata minimal** - Only add what's truly useful for auditing
4. **Never log sensitive data** - Passwords, tokens, etc. should never be in audit logs
5. **Fire and forget** - Audit logging is async and won't block responses

## Migration Guide

If you have routes using the old manual approach:

### Before
```typescript
import { auditLog } from "@/lib/audit/audit-middleware";

export async function POST(req: NextRequest) {
  // ... route logic ...

  await auditLog(req, "CREATE", "task", {
    entityId: task.id,
    metadata: { taskName: task.name },
  });

  return NextResponse.json(task);
}
```

### After
```typescript
import { withAuditLog } from "@/lib/audit/withAuditLog";

export const POST = withAuditLog(async (req) => {
  // ... route logic ...
  return NextResponse.json(task);
}, {
  auto: true,
  entityType: "task"
});
```

Much cleaner! 🎉

## Custom Actions

For special operations beyond CRUD, specify a custom action:

```typescript
export const POST = withAuditLog(async (req) => {
  // Approve a file
  await approveFile(id);
  return NextResponse.json({ success: true });
}, {
  action: "APPROVE",
  entityType: "file",
});
```

Available custom actions:
- `APPROVE`, `REJECT`
- `SUBMIT`, `RETURN`
- `UPLOAD`, `DOWNLOAD`
- `ASSIGN`, `UNASSIGN`
- `EXPORT`
- `GRANT_PERMISSION`, `REVOKE_PERMISSION`
- `ASSIGN_ROLE`, `REMOVE_ROLE`
