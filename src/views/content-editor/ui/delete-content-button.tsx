"use client";

import { useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { deleteContent } from "../api/save-content";

export function DeleteContentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this content from the plan?")) return;
        startTransition(() => deleteContent(id));
      }}
    >
      Delete
    </Button>
  );
}
