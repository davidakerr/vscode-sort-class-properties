import * as vscode from "vscode";

function sortLines(
  textEditor: vscode.TextEditor,
  startLine: number,
  endLine: number
): Thenable<boolean> {
  let lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(textEditor.document.lineAt(i).text);
  }

  interface SortStructure {
    chunk: string[];
    sortKey?: string;
  }

  const structure: SortStructure[] = [];
  let chunkIndex = 0;

  function addChunkToStructure(line: string, index: number) {
    if (structure?.[index]?.chunk) {
      structure[index].chunk.push(line);
    } else {
      structure.push({ chunk: [line] });
    }
  }

  function addSorterToStructure(line: string, index: number) {
    if (structure?.[index]) {
      structure[index].chunk.push(line);
      structure[index].sortKey = line.trim().toLowerCase();
    } else {
      structure.push({ chunk: [line], sortKey: line.trim().toLowerCase() });
    }
    chunkIndex = chunkIndex + 1;
  }

  lines.forEach((line, index) => {
    if(!line.trim()) {
       // Do nothing
    }
    else if (line.match(/[ \t]?(\/\/|@|\/|\*)/g)) {
      addChunkToStructure(line, chunkIndex);
    } else {
      addSorterToStructure(line, chunkIndex);
    }
  });

  const sortedStructure = structure.sort((a: SortStructure, b: SortStructure) =>
    a.sortKey && b.sortKey && a?.sortKey < b?.sortKey ? -1 : 1
  );

  let newLines: string[] = [];

  sortedStructure.forEach((item) => {
    newLines = [...newLines, ...item.chunk];
  });

  return textEditor.edit((editBuilder) => {
    const range = new vscode.Range(
      startLine,
      0,
      endLine,
      textEditor.document.lineAt(endLine).text.length
    );
    editBuilder.replace(range, newLines.join("\n"));
  });
}

export function sorter(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit
) {
  if (!textEditor) {
    return undefined;
  }
  const selection = textEditor.selection;

  if (!selection.isEmpty) {
    return sortLines(
      textEditor,
      textEditor.selection.start.line,
      textEditor.selection.end.line
    );
  }
}
