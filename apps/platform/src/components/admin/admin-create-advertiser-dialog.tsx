"use client";

import { UserPlus } from "lucide-react";
import { AdminCreateAdvertiserForm } from "@/components/admin/admin-create-advertiser-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AdminCreateAdvertiserDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button className="h-10 gap-2 rounded-xl bg-[var(--theme-primary)] hover:opacity-90" />}>
        <UserPlus className="h-4 w-4" />
        Add Advertiser
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Advertiser Account</DialogTitle>
          <DialogDescription>
            Add a new advertiser, set their status, and share the temporary password after creation.
          </DialogDescription>
        </DialogHeader>
        <AdminCreateAdvertiserForm />
      </DialogContent>
    </Dialog>
  );
}
