/**
 * 週報エディタコンポーネント
 * 入力エリア・出力エリア・保存機能
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatWeeklyReport } from '@/lib/weekly-report-utils';
import { Save, Loader2 } from 'lucide-react';
import type { WeekRange } from '@/hooks/useWeekNavigation';

interface WeeklyReportEditorProps {
  weekRange: WeekRange;
  initialContent?: string;
}

export function WeeklyReportEditor({
  weekRange,
  initialContent = '',
}: WeeklyReportEditorProps) {
  const [input, setInput] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const formattedOutput = formatWeeklyReport(input);

  useEffect(() => {
    setInput(initialContent);
  }, [initialContent]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setSaveMessage('');

      const response = await fetch('/api/weekly-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: format(weekRange.start, 'yyyy-MM-dd'),
          weekEnd: format(weekRange.end, 'yyyy-MM-dd'),
          content: input,
        }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      setSaveMessage('保存しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('保存エラー');
      console.error('週報保存エラー:', error);
    } finally {
      setSaving(false);
    }
  }, [weekRange, input]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {/* 入力エリア */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>週報入力</CardTitle>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </div>
          {saveMessage && (
            <p className={`text-sm ${saveMessage.includes('エラー') ? 'text-red-500' : 'text-green-500'}`}>
              {saveMessage}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="週報を入力してください（半角文字は自動で全角に変換され、36文字で折り返されます）"
            className="min-h-[400px] font-mono"
          />
        </CardContent>
      </Card>

      {/* 出力エリア */}
      <Card>
        <CardHeader>
          <CardTitle>フォーマット済み出力</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] p-4 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
            {formattedOutput || '（プレビュー）'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
