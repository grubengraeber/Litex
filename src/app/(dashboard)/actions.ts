"use server";

import { auth } from "@/lib/auth";
import {
  getTasksForUser,
  getTaskStats,
  getAllCompanies,
  type TaskFilters,
} from "@/db/queries";

export async function fetchTasks(filters: TaskFilters = {}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { id: userId, role, companyId } = session.user;

  if (!role) {
    throw new Error("User role not set");
  }

  const tasks = await getTasksForUser(userId, role, companyId || null, filters);
  return tasks;
}

export async function fetchTaskStats(filters: TaskFilters = {}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { id: userId, role, companyId } = session.user;

  if (!role) {
    throw new Error("User role not set");
  }

  const stats = await getTaskStats(userId, role, companyId || null, filters);
  return stats;
}

export async function fetchCompanies() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const companies = await getAllCompanies();
  return companies;
}

export async function fetchCurrentUser() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    companyId: session.user.companyId,
  };
}
