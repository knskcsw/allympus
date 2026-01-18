/**
 * 週報テキスト処理ユーティリティ
 * - 半角文字→全角文字変換
 * - 36文字で強制折り返し
 */

/**
 * 半角文字を全角文字に変換
 */
export function toFullWidth(text: string): string {
  return text.replace(/[!-~]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) + 0xFEE0);
  }).replace(/\u0020/g, '\u3000'); // 半角スペースを全角スペースに
}

/**
 * テキストを36文字で折り返し
 */
export function wrapTextAt36Chars(text: string): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (const char of text) {
    if (char === '\n') {
      lines.push(currentLine);
      currentLine = '';
      continue;
    }

    // 文字幅を計算（全角=2、半角=1）
    const charWidth = char.match(/[^\x00-\xff]/) ? 2 : 1;
    const currentWidth = [...currentLine].reduce((width, c) => {
      return width + (c.match(/[^\x00-\xff]/) ? 2 : 1);
    }, 0);

    if (currentWidth + charWidth > 36) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine += char;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 週報フォーマット統合処理
 * 1. 半角→全角変換
 * 2. 36文字で折り返し
 */
export function formatWeeklyReport(input: string): string {
  const fullWidth = toFullWidth(input);
  const lines = wrapTextAt36Chars(fullWidth);
  return lines.join('\n');
}
