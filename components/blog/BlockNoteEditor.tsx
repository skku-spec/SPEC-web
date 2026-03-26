"use client";

import { useEffect, useMemo, useRef } from "react";

import { BlockNoteView, type Theme } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface BlockNoteEditorProps {
  initialHTML?: string;
  onChange?: (html: string) => void;
  onWordCountChange?: (count: number) => void;
  uploadFile?: (file: File) => Promise<string>;
  editable?: boolean;
  placeholder?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  if (!text) {
    return 0;
  }

  return text.split(/\s+/).filter(Boolean).length;
}

export default function BlockNoteEditor({
  initialHTML,
  onChange,
  onWordCountChange,
  uploadFile,
  editable = true,
  placeholder = "본문을 작성하세요...",
}: BlockNoteEditorProps) {
  const hasHydratedInitialContentRef = useRef(false);
  const skipNextChangeRef = useRef(false);

  const theme = useMemo<Theme>(
    () => ({
      borderRadius: 8,
      fontFamily: '"Pretendard", "MaruBuri", sans-serif',
      colors: {
        editor: {
          background: "#fcfcf8",
          text: "#16140f",
        },
        menu: {
          background: "#ffffff",
          text: "#16140f",
        },
        tooltip: {
          background: "#ffffff",
          text: "#16140f",
        },
        hovered: {
          background: "rgba(255, 108, 15, 0.12)",
          text: "#16140f",
        },
        selected: {
          background: "#FF6C0F",
          text: "#ffffff",
        },
        border: "#ddd9cc",
        sideMenu: "#FF6C0F",
      },
    }),
    [],
  );

  const editor = useCreateBlockNote(
    {
      uploadFile,
      placeholders: {
        default: placeholder,
        emptyDocument: placeholder,
      },
    },
    [uploadFile, placeholder],
  );

  const emitWordCount = (html: string) => {
    if (!onWordCountChange) {
      return;
    }

    onWordCountChange(countWords(stripHtml(html)));
  };

  useEffect(() => {
    if (hasHydratedInitialContentRef.current) {
      return;
    }

    hasHydratedInitialContentRef.current = true;

    if (!initialHTML?.trim()) {
      emitWordCount("");
      return;
    }

    const parsedBlocks = editor.tryParseHTMLToBlocks(initialHTML);

    skipNextChangeRef.current = true;
    editor.replaceBlocks(editor.document, parsedBlocks);
    emitWordCount(editor.blocksToHTMLLossy(editor.document));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialHTML]);

  const handleEditorChange = () => {
    if (skipNextChangeRef.current) {
      skipNextChangeRef.current = false;
      return;
    }

    const html = editor.blocksToHTMLLossy(editor.document);
    onChange?.(html);
    emitWordCount(html);
  };

  return (
    <div className="blocknote-editor-root min-h-[400px]">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleEditorChange}
        theme={theme}
        className="blocknote-editor-view"
      />

      <style jsx global>{`
        .blocknote-editor-root .bn-container {
          background: transparent;
          border: 0;
          box-shadow: none;
        }

        .blocknote-editor-root .bn-editor {
          min-height: 400px;
          background: #fcfcf8;
          color: #16140f;
          padding: 0;
          font-family: "Pretendard", "MaruBuri", sans-serif;
        }

        .blocknote-editor-root .bn-editor p,
        .blocknote-editor-root .bn-editor li,
        .blocknote-editor-root .bn-editor h1,
        .blocknote-editor-root .bn-editor h2,
        .blocknote-editor-root .bn-editor h3,
        .blocknote-editor-root .bn-editor h4 {
          font-family: "Pretendard", "MaruBuri", sans-serif;
        }

        .blocknote-editor-root .bn-editor .bn-block-content[data-is-empty-and-focused] [data-placeholder]::before,
        .blocknote-editor-root .bn-editor .bn-block-content [data-placeholder]::before {
          color: #b5b2a6 !important;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
