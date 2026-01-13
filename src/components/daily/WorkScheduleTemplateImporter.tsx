"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

type WorkScheduleTemplate = {
  id: string;
  name: string;
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      message = JSON.parse(text).error || text;
    } catch {
      // Fallback to raw text when not JSON.
    }
    throw new Error(message || "Request failed");
  }
  return text ? JSON.parse(text) : null;
}

type WorkScheduleTemplateImporterProps = {
  selectedDate: Date;
  onImportComplete: () => void;
};

export default function WorkScheduleTemplateImporter({
  selectedDate,
  onImportComplete,
}: WorkScheduleTemplateImporterProps) {
  const [templates, setTemplates] = useState<WorkScheduleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/work-schedule-templates");
      const data = await parseJsonResponse(response);
      setTemplates(data || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleImport = async (templateId: string) => {
    setImportingTemplateId(templateId);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetch(`/api/work-schedule-templates/${templateId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      const result = await parseJsonResponse(response);
      alert(`${result.count}件の稼働実績を登録しました`);
      onImportComplete();
    } catch (error) {
      console.error("Failed to import template:", error);
      alert("テンプレートのインポートに失敗しました");
    } finally {
      setImportingTemplateId(null);
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        className={`flex flex-row items-center justify-between ${
          isOpen ? "" : "py-2"
        }`}
      >
        <CardTitle className={isOpen ? "" : "text-sm"}>
          稼働実績テンプレート
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? (
            <span className="flex items-center gap-1">
              折りたたむ
              <ChevronUp className="h-4 w-4" />
            </span>
          ) : (
            <span className="flex items-center gap-1">
              開く
              <ChevronDown className="h-4 w-4" />
            </span>
          )}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                size="sm"
                variant="outline"
                onClick={() => handleImport(template.id)}
                disabled={importingTemplateId !== null}
              >
                <Download className="h-4 w-4 mr-1" />
                {importingTemplateId === template.id ? "取り込み中..." : template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
