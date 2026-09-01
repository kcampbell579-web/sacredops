import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NewTaskForm from "./NewTaskForm";

export default async function NewTaskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-extrabold text-[#3f2c39]">Post a task 📝</h1>
      <p className="mt-2 text-[#6b4b5f]">Tell the village what you need. Another mom can pick it up.</p>
      <NewTaskForm defaultNeighborhood={user.neighborhood ?? ""} />
    </div>
  );
}
