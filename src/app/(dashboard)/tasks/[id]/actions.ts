"use server";

import { auth } from "@/lib/auth";
import {
  getTaskById,
  getCommentsForTask,
  createComment,
  deleteComment,
  getFilesForTask,
  updateTask,
} from "@/db/queries";
import { revalidatePath } from "next/cache";

export async function fetchTaskDetails(taskId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  // Check if user has access to this task
  const { role, companyId } = session.user;
  if (role === "customer" && task.companyId !== companyId) {
    throw new Error("Access denied");
  }

  return task;
}

export async function fetchTaskComments(taskId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify access to task
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const { role, companyId } = session.user;
  if (role === "customer" && task.companyId !== companyId) {
    throw new Error("Access denied");
  }

  const comments = await getCommentsForTask(taskId);
  return comments;
}

export async function addComment(taskId: string, content: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify access to task
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const { id: userId, role, companyId } = session.user;
  if (role === "customer" && task.companyId !== companyId) {
    throw new Error("Access denied");
  }

  const comment = await createComment({
    taskId,
    userId,
    content,
  });

  revalidatePath(`/tasks/${taskId}`);
  return comment;
}

export async function removeComment(commentId: string, taskId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only employees can delete comments
  if (session.user.role !== "employee") {
    throw new Error("Only employees can delete comments");
  }

  await deleteComment(commentId);
  revalidatePath(`/tasks/${taskId}`);
}

export async function fetchTaskFiles(taskId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify access to task
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const { role, companyId } = session.user;
  if (role === "customer" && task.companyId !== companyId) {
    throw new Error("Access denied");
  }

  const files = await getFilesForTask(taskId);
  return files;
}

export async function submitTask(taskId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify access to task
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const { role, companyId } = session.user;
  if (role === "customer" && task.companyId !== companyId) {
    throw new Error("Access denied");
  }

  // Only customers can submit
  if (role !== "customer") {
    throw new Error("Only customers can submit tasks");
  }

  await updateTask(taskId, { status: "submitted" });
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function completeTask(taskId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only employees can complete
  if (session.user.role !== "employee") {
    throw new Error("Only employees can complete tasks");
  }

  await updateTask(taskId, {
    status: "completed",
    completedAt: new Date(),
    completedBy: session.user.id,
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function returnTaskToCustomer(taskId: string, comment: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only employees can return tasks
  if (session.user.role !== "employee") {
    throw new Error("Only employees can return tasks");
  }

  // Update task status to open
  await updateTask(taskId, { status: "open" });

  // Add comment explaining why
  await createComment({
    taskId,
    userId: session.user.id,
    content: `🔄 Zurück an Kunde: ${comment}`,
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
