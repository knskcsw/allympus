"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface AddHolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onAdd: (data: { date: Date; name: string; type: string }) => void;
}

const HOLIDAY_TYPES = [
  { value: "PUBLIC_HOLIDAY", label: "祝日・国民の休日" },
  { value: "WEEKEND", label: "定休日（土日など）" },
  { value: "SPECIAL_HOLIDAY", label: "特別休日" },
];

export function AddHolidayDialog({
  open,
  onOpenChange,
  selectedDate,
  onAdd,
}: AddHolidayDialogProps) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("PUBLIC_HOLIDAY");

  useEffect(() => {
    if (selectedDate) {
      setDate(format(selectedDate, "yyyy-MM-dd"));
    } else {
      setDate("");
    }
    setName("");
    setType("PUBLIC_HOLIDAY");
  }, [selectedDate, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !name || !type) {
      alert("すべての項目を入力してください");
      return;
    }

    onAdd({
      date: new Date(date),
      name,
      type,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>休日を追加</DialogTitle>
          <DialogDescription>
            会社の休日を登録します。同じ日付に既に休日が登録されている場合は上書きされます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">休日名</Label>
              <Input
                id="name"
                type="text"
                placeholder="例：元日、成人の日、夏季休暇"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">種類</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
