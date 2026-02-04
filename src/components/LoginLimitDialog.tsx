import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: () => void;
}

export function LoginLimitDialog({ open, onOpenChange, onPurchase }: LoginLimitDialogProps) {
  const handlePurchase = () => {
    onPurchase();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>登录次数不足</DialogTitle>
          <DialogDescription>
            您的账号剩余可登录次数为 0 ，请购买或续费套餐后再登录！
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            确认
          </Button>
          <Button
            onClick={handlePurchase}
            className="w-full sm:w-auto"
          >
            购买登录次数
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}