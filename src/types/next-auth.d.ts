import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "customer" | "employee" | null;
    companyId?: string | null;
    status?: "pending" | "active" | "disabled" | null;
  }
  
  interface Session {
    user: User & {
      id: string;
      role?: "customer" | "employee" | null;
      companyId?: string | null;
      status?: "pending" | "active" | "disabled" | null;
    };
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: "customer" | "employee" | null;
    companyId?: string | null;
    status?: "pending" | "active" | "disabled" | null;
  }
}
