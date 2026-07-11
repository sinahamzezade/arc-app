import { redirect } from "next/navigation";
import { getDefaultLessonId } from "@/lib/lesson/mock-data";

export default function LearnIndexPage() {
  redirect(`/learn/${getDefaultLessonId()}`);
}
