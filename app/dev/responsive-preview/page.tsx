import { notFound } from "next/navigation";
import { ResponsivePreviewWorkbench } from "@/components/experience/ResponsivePreviewWorkbench";

export default function ResponsivePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ResponsivePreviewWorkbench />;
}
