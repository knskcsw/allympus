"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { WORK_TYPES, type WorkType } from "@/lib/workTypes";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    name: string;
    abbreviation?: string;
    workType: WorkType;
    wbsList: { name: string }[];
  }) => void;
}

export function ProjectForm({ open, onClose, onSubmit }: ProjectFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [workType, setWorkType] = useState<WorkType>("IN_PROGRESS");
  const [wbsList, setWbsList] = useState<string[]>([""]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      code,
      name,
      abbreviation: abbreviation.trim() || undefined,
      workType,
      wbsList: wbsList.filter((w) => w.trim()).map((w) => ({ name: w.trim() })),
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setAbbreviation("");
    setWorkType("IN_PROGRESS");
    setWbsList([""]);
  };

  const addWbsField = () => {
    setWbsList((prev) => [...prev, ""]);
  };

  const removeWbsField = (index: number) => {
    setWbsList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWbsField = (index: number, value: string) => {
    setWbsList((prev) => prev.map((w, i) => (i === index ? value : w)));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., PJ25A20345"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., FY25_Project_Name"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Abbreviation (optional)</label>
            <Input
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="e.g., PJA"
            />
          </div>

          <div>
            <label className="text-sm font-medium">稼働タイプ</label>
            <Select value={workType} onValueChange={(value) => setWorkType(value as WorkType)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="稼働タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">WBS Items (optional)</label>
            <div className="space-y-2 mt-2">
              {wbsList.map((wbs, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={wbs}
                    onChange={(e) => updateWbsField(index, e.target.value)}
                    placeholder="e.g., Meeting, Data collection, etc."
                  />
                  {wbsList.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8"
                      onClick={() => removeWbsField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWbsField}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add WBS
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
