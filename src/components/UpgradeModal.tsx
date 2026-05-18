"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUpgradeStore } from "@/lib/store/upgrade";

export function UpgradeModal() {
  const { open, message, close } = useUpgradeStore();
  const router = useRouter();

  return (
    <Modal open={open} onClose={close} className="max-w-md">
      <div className="space-y-4 p-6 text-center">
        <div className="text-3xl">🚀</div>
        <h2 className="text-lg font-semibold">Time to upgrade</h2>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="secondary" onClick={close}>
            Not now
          </Button>
          <Button
            onClick={() => {
              close();
              router.push("/settings?tab=Subscription");
            }}
          >
            View plans
          </Button>
        </div>
      </div>
    </Modal>
  );
}
