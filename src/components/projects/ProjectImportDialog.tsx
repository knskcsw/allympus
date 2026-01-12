"use client";

import { useState } from "react";
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
import { Upload, CheckCircle, XCircle } from "lucide-react";

interface ProjectImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type ImportResult = {
  success: boolean;
  projectsCreated: number;
  projectsUpdated: number;
  wbsCreated: number;
  errors: Array<{ row: number; message: string }>;
};

export function ProjectImportDialog({
  open,
  onOpenChange,
  onComplete,
}: ProjectImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);

      // ファイルをテキストとして読み込み
      const text = await file.text();

      const res = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: text }),
      });

      if (res.ok) {
        const data: ImportResult = await res.json();
        setResult(data);

        if (data.errors.length === 0) {
          setTimeout(() => {
            onComplete();
            onOpenChange(false);
            resetState();
          }, 2000);
        }
      } else {
        const error = await res.json();
        console.error("Import failed:", error);
        alert("CSVインポートに失敗しました");
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("CSVインポートに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>プロジェクトCSVインポート</DialogTitle>
          <DialogDescription>
            CSVファイルからプロジェクトとWBSを一括登録します。
            同じプロジェクトコードは更新されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSVファイル</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                選択中: {file.name}
              </p>
            )}
          </div>

          {result && (
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-semibold">インポート結果</h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>新規プロジェクト: {result.projectsCreated}件</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>更新プロジェクト: {result.projectsUpdated}件</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>作成WBS: {result.wbsCreated}件</span>
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="font-semibold">
                        エラー: {result.errors.length}件
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto rounded bg-destructive/10 p-2">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-xs text-destructive">
                          {error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? (
              <>インポート中...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                インポート
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
