"use client";

import { useEffect, useMemo, useRef } from "react";

import { BlockNoteView, type Theme } from "@blocknote/mantine";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  createCodeBlockSpec,
} from "@blocknote/core";
import { codeBlockOptions } from "@blocknote/code-block";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

/**
 * 전역적으로 Suggestion 아이템을 필터링하는 유틸리티 함수입니다.
 * @blocknote/core 에서 가져오기 힘든 경우를 위해 직접 구현합니다.
 */
const filterSuggestionItems = (items: any[], query: string) => {
  return items.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
    const aliasMatch = item.aliases?.some((alias: string) =>
      alias.toLowerCase().includes(query.toLowerCase()),
    );
    return titleMatch || aliasMatch;
  });
};

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

/**
 * Slash 메뉴 아이템의 이름을 마크다운 문법을 포함하도록 변경합니다.
 */
const getCustomSlashMenuItems = (editor: any) => {
  const items = getDefaultReactSlashMenuItems(editor);

  return items.map((item) => {
    switch (item.title) {
      case "Heading 1":
        return {
          ...item,
          title: "# 제목 1",
          aliases: ["#", "h1", "heading1", "제목1"],
        };
      case "Heading 2":
        return {
          ...item,
          title: "## 제목 2",
          aliases: ["##", "h2", "heading2", "제목2"],
        };
      case "Heading 3":
        return {
          ...item,
          title: "### 제목 3",
          aliases: ["###", "h3", "heading3", "제목3"],
        };
      case "Bullet List":
        return {
          ...item,
          title: "- 불렛 리스트",
          aliases: ["-", "ul", "bulletlist", "리스트"],
        };
      case "Numbered List":
        return {
          ...item,
          title: "1. 번호 리스트",
          aliases: ["1.", "ol", "numberedlist", "순서"],
        };
      case "Check List":
        return {
          ...item,
          title: "[ ] 체크 리스트",
          aliases: ["[]", "checklist", "할일"],
        };
      case "Quote":
        return {
          ...item,
          title: "> 인용구",
          aliases: [">", "quote", "인용"],
        };
      case "Code Block":
        return {
          ...item,
          title: "``` 코드 블록",
          aliases: ["```", "code", "코드"],
        };
      case "Divider":
      case "Horizontal Rule":
        return {
          ...item,
          title: "--- 구분선",
          aliases: ["---", "divider", "line", "구분선"],
        };
      case "Image":
        return {
          ...item,
          title: "![] 이미지",
          aliases: ["![]", "image", "img", "이미지"],
        };
      case "Table":
        return {
          ...item,
          title: "| 표",
          aliases: ["|", "table", "표"],
        };
      default:
        return item;
    }
  });
};

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

  const schema = useMemo(
    () =>
      BlockNoteSchema.create({
        blockSpecs: {
          ...defaultBlockSpecs,
          codeBlock: createCodeBlockSpec(codeBlockOptions),
        },
      }),
    [],
  );

  const editor = useCreateBlockNote(
    {
      schema,
      uploadFile,
      placeholders: {
        default: placeholder,
        emptyDocument: placeholder,
      },
    },
    [uploadFile, placeholder, schema],
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
        sideMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>

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
