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
 * Slash 메뉴 아이템을 Notion 스타일로 필터링하고 이름을 변경합니다.
 */
const getCustomSlashMenuItems = (editor: any) => {
  const items = getDefaultReactSlashMenuItems(editor);

  const notionLikeItems = [
    {
      key: "paragraph",
      title: "텍스트",
      aliases: ["p", "text", "텍스트", "t"],
    },
    {
      key: "heading",
      title: "제목 1",
      aliases: ["h1", "heading1", "제목1", "#"],
    },
    {
      key: "heading_2",
      title: "제목 2",
      aliases: ["h2", "heading2", "제목2", "##"],
    },
    {
      key: "heading_3",
      title: "제목 3",
      aliases: ["h3", "heading3", "제목3", "###"],
    },
    {
      key: "table",
      title: "표",
      aliases: ["table", "grid", "표", "t"],
    },
    {
      key: "check_list",
      title: "할 일 목록",
      aliases: ["todo", "checklist", "체크", "[]"],
    },
    {
      key: "bullet_list",
      title: "글머리 기호 목록",
      aliases: ["ul", "bulletlist", "목록", "-"],
    },
    {
      key: "numbered_list",
      title: "번호 매기기 목록",
      aliases: ["ol", "numberedlist", "순서", "1."],
    },
    {
      key: "toggle_list",
      title: "토글 목록",
      aliases: ["toggle", "togglelist", "토글", "> "],
    },
    {
      key: "quote",
      title: "인용",
      aliases: ["quote", "blockquote", "인용", ">"],
    },
    {
      key: "divider",
      title: "구분선",
      aliases: ["divider", "hr", "line", "구분선", "---"],
    },
    {
      key: "image",
      title: "이미지",
      aliases: ["image", "img", "picture", "이미지", "![]"],
    },
    {
      key: "code_block",
      title: "코드 블록",
      aliases: ["code", "codeblock", "코드", "```"],
    },
  ];

  // 기존 아이템들 중에서 notionLikeItems에 정의된 key들만 필터링하고 내용을 업데이트합니다.
  return notionLikeItems
    .map((notionItem) => {
      const originalItem = items.find(
        (item: any) => item.key === notionItem.key,
      );
      if (originalItem) {
        return {
          ...originalItem,
          title: notionItem.title,
          aliases: notionItem.aliases,
        };
      }
      return null;
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);
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
