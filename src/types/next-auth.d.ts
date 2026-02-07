import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "employee" | "customer" | null;
    companyId?: string | null;
    status?: "pending" | "active" | "disabled" | null;
  }
  
  interface Session {
    user: User & {
      id: string;
      role?: "admin" | "employee" | "customer" | null;
      companyId?: string | null;
      status?: "pending" | "active" | "disabled" | null;
    };
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: "admin" | "employee" | "customer" | null;
    companyId?: string | null;
    status?: "pending" | "active" | "disabled" | null;
  }
}
