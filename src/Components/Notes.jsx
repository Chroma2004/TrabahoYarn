import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import {
  Plus,
  Trash2,
  StickyNote,
  Search,
  Check,
  CalendarDays,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  ChevronDown,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Eraser,
  Minus,
  Quote,
  MoreHorizontal,
} from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================

const TEXT_COLORS = [
  { name: 'Default', color: '#191919' },
  { name: 'Gray', color: '#857665' },
  { name: 'Red', color: '#C7503E' },
  { name: 'Orange', color: '#F36B21' },
  { name: 'Yellow', color: '#B89525' },
  { name: 'Green', color: '#397B49' },
  { name: 'Teal', color: '#176D70' },
  { name: 'Blue', color: '#356F9C' },
  { name: 'Purple', color: '#7651A8' },
  { name: 'Pink', color: '#AC4C73' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#F9E58B' },
  { name: 'Orange', color: '#F8C9A5' },
  { name: 'Pink', color: '#F2C5D7' },
  { name: 'Purple', color: '#D7C4F3' },
  { name: 'Blue', color: '#BCDDF5' },
  { name: 'Green', color: '#C5E3C5' },
  { name: 'Teal', color: '#B8E4DC' },
  { name: 'Gray', color: '#D8D8D8' },
  { name: 'Red', color: '#F5B9B1' },
  { name: 'Beige', color: '#EAD5BD' },
];

const HEADING_OPTIONS = [
  {
    value: 'p',
    label: 'Body',
    className: 'text-sm font-normal',
  },
  {
    value: 'h1',
    label: 'Title',
    className: 'text-xl font-bold',
  },
  {
    value: 'h2',
    label: 'Heading',
    className: 'text-lg font-bold',
  },
  {
    value: 'h3',
    label: 'Subheading',
    className: 'text-sm font-bold',
  },
  {
    value: 'blockquote',
    label: 'Quote',
    className: 'text-sm italic',
  },
];

// ============================================================
// DATE HELPERS
// ============================================================

function formatNoteDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date);
}

// ============================================================
// HTML HELPERS
// ============================================================

function escapeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHTML(html = '') {
  const template = document.createElement('template');

  template.innerHTML = String(html);

  const allowedTags = new Set([
    'P',
    'DIV',
    'BR',
    'B',
    'STRONG',
    'I',
    'EM',
    'U',
    'S',
    'STRIKE',
    'SPAN',
    'FONT',
    'H1',
    'H2',
    'H3',
    'H4',
    'UL',
    'OL',
    'LI',
    'BLOCKQUOTE',
    'HR',
    'MARK',
    'DEL',
    'SUB',
    'SUP',
  ]);

  const blockedTags = new Set([
    'SCRIPT',
    'STYLE',
    'IFRAME',
    'OBJECT',
    'EMBED',
    'SVG',
    'MATH',
    'FORM',
    'INPUT',
    'BUTTON',
    'LINK',
    'META',
    'TEMPLATE',
  ]);

  const allowedStyles = new Set([
    'color',
    'background-color',
    'font-weight',
    'font-style',
    'font-size',
    'text-decoration',
    'text-decoration-line',
    'text-align',
    'vertical-align',
  ]);

  const cleanNode = (node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove();
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    if (blockedTags.has(node.tagName)) {
      node.remove();
      return;
    }

    Array.from(node.childNodes).forEach(cleanNode);

    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    const safeStyles = [];

    for (const property of allowedStyles) {
      const value = node.style.getPropertyValue(property);

      if (
        value &&
        !/url\s*\(|expression\s*\(|var\s*\(|javascript:/i.test(value)
      ) {
        safeStyles.push([property, value]);
      }
    }

    const fontColor =
      node.tagName === 'FONT'
        ? node.getAttribute('color')
        : null;

    const alignment = node.getAttribute('align');

    Array.from(node.attributes).forEach((attribute) => {
      node.removeAttribute(attribute.name);
    });

    safeStyles.forEach(([property, value]) => {
      node.style.setProperty(property, value);
    });

    if (fontColor) {
      node.style.color = fontColor;
    }

    if (
      alignment &&
      ['left', 'center', 'right', 'justify'].includes(alignment)
    ) {
      node.style.textAlign = alignment;
    }
  };

  Array.from(template.content.childNodes).forEach(cleanNode);

  return template.innerHTML;
}

function getNoteHTML(note) {
  if (!note) return '';

  if (typeof note.contentHtml === 'string') {
    return sanitizeHTML(note.contentHtml);
  }

  return escapeHTML(note.content || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br>');
}

function getPlainText(html = '') {
  const element = document.createElement('div');

  element.innerHTML = sanitizeHTML(html);

  element.querySelectorAll('br').forEach((node) => {
    node.replaceWith(document.createTextNode('\n'));
  });

  element
    .querySelectorAll('p, div, h1, h2, h3, li, blockquote')
    .forEach((node) => {
      node.appendChild(document.createTextNode('\n'));
    });

  return (element.textContent || '').trim();
}

function getNotePreview(note) {
  if (typeof note.contentHtml === 'string') {
    return getPlainText(note.contentHtml);
  }

  return note.content || '';
}

// ============================================================
// TOOLBAR BUTTON
// ============================================================

function ToolbarButton({
  icon: Icon,
  title,
  active = false,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`
        flex h-8 w-8 shrink-0
        items-center justify-center
        rounded-md transition-colors duration-150
        disabled:cursor-not-allowed disabled:opacity-30
        ${
          active
            ? 'bg-[#F36B21] text-white'
            : 'text-[#675C50] hover:bg-[#EAD5BD] hover:text-[#191919]'
        }
      `}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

// ============================================================
// TOOLBAR DIVIDER
// ============================================================

function ToolbarDivider() {
  return (
    <span
      aria-hidden="true"
      className="mx-0.5 h-5 w-px shrink-0 bg-[#D8C4AD]"
    />
  );
}

// ============================================================
// COLOR MENU
// ============================================================

function ColorMenu({
  title,
  colors,
  selectedColor,
  onSelect,
  onReset,
  resetLabel,
  isHighlight = false,
}) {
  return (
    <div className="p-3">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#857665]">
        {title}
      </p>

      <div className="grid grid-cols-5 gap-2">
        {colors.map((item) => (
          <button
            key={item.name}
            type="button"
            title={item.name}
            aria-label={item.name}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(item.color)}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-full border border-black/10
              transition-transform
              hover:scale-110 active:scale-95
            "
            style={{
              backgroundColor: item.color,
            }}
          >
            {selectedColor === item.color && (
              <Check
                size={14}
                className={
                  isHighlight
                    ? 'text-[#191919]'
                    : 'text-white'
                }
              />
            )}
          </button>
        ))}
      </div>

      <div className="my-3 h-px bg-[#D8C4AD]" />

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onReset}
        className="
          flex w-full items-center gap-2
          rounded-lg px-2 py-2
          text-xs font-medium text-[#857665]
          transition-colors hover:bg-[#F5E4CF]
        "
      >
        <Eraser size={14} />
        {resetLabel}
      </button>
    </div>
  );
}

// ============================================================
// RICH TEXT EDITOR
// ============================================================

function RichTextEditor({ note, onChange }) {
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  const popupRef = useRef(null);
  const menuRef = useRef(null);
  const selectionRef = useRef(null);
  const selectionFrameRef = useRef(null);
  const isSelectingRef = useRef(false);

  const [openMenu, setOpenMenu] = useState(null);
  const [heading, setHeading] = useState('p');
  const [textColor, setTextColor] = useState('#191919');
  const [highlightColor, setHighlightColor] = useState('#F9E58B');
  const [activeFormats, setActiveFormats] = useState({});

  const [popup, setPopup] = useState({
    visible: false,
    x: 0,
    y: 0,
    placement: 'top',
  });

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  // ==========================================================
  // LOAD NOTE
  // ==========================================================

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) return;

    editor.innerHTML = getNoteHTML(note);

    selectionRef.current = null;

    setOpenMenu(null);
    setHeading('p');
    setTextColor('#191919');
    setHighlightColor('#F9E58B');
    setActiveFormats({});

    setPopup({
      visible: false,
      x: 0,
      y: 0,
      placement: 'top',
    });
  }, [note.id]);

  // ==========================================================
  // SELECTION HELPERS
  // ==========================================================

  const getEditorRange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0
    ) {
      return null;
    }

    const range = selection.getRangeAt(0);

    if (
      !editor.contains(range.startContainer) ||
      !editor.contains(range.endContainer)
    ) {
      return null;
    }

    return range;
  };

  const saveSelection = () => {
    const range = getEditorRange();

    if (range) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;

    if (!editor) return false;

    const savedRange = selectionRef.current;

    editor.focus({
      preventScroll: true,
    });

    const selection = window.getSelection();

    if (!selection) return false;

    if (
      savedRange &&
      editor.contains(savedRange.startContainer) &&
      editor.contains(savedRange.endContainer)
    ) {
      selection.removeAllRanges();
      selection.addRange(savedRange);

      return true;
    }

    const range = document.createRange();

    range.selectNodeContents(editor);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);

    selectionRef.current = range.cloneRange();

    return true;
  };

  // ==========================================================
  // HIDE POPUP
  // ==========================================================

  const hidePopup = () => {
    setPopup((previous) =>
      previous.visible
        ? {
            ...previous,
            visible: false,
          }
        : previous
    );

    setOpenMenu(null);
  };

  // ==========================================================
  // ACTIVE FORMATTING
  // ==========================================================

  const updateActiveFormats = () => {
    const range = getEditorRange();

    if (!range) return;

    const commands = [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'insertUnorderedList',
      'insertOrderedList',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      'justifyFull',
    ];

    const formats = {};

    commands.forEach((command) => {
      try {
        formats[command] =
          document.queryCommandState(command);
      } catch {
        formats[command] = false;
      }
    });

    setActiveFormats(formats);

    try {
      const currentBlock = String(
        document.queryCommandValue('formatBlock') || 'p'
      )
        .toLowerCase()
        .replace(/[<>]/g, '');

      setHeading(
        ['h1', 'h2', 'h3', 'blockquote'].includes(currentBlock)
          ? currentBlock
          : 'p'
      );
    } catch {
      setHeading('p');
    }
  };

  // ==========================================================
  // FLOATING TOOLBAR POSITION
  // ==========================================================

  const updatePopupPosition = () => {
    const range = getEditorRange();

    if (
      !range ||
      range.collapsed ||
      !range.toString().trim()
    ) {
      hidePopup();
      return;
    }

    if (isSelectingRef.current) {
      return;
    }

    const rect = range.getBoundingClientRect();

    if (
      !rect.width ||
      rect.bottom < 0 ||
      rect.top > window.innerHeight
    ) {
      hidePopup();
      return;
    }

    const viewportPadding = 12;
    const gap = 12;

    const toolbarWidth = Math.min(
      350,
      window.innerWidth - viewportPadding * 2
    );

    const toolbarHeight =
      popupRef.current?.offsetHeight ||
      (window.innerWidth < 370 ? 80 : 46);

    const centerX = rect.left + rect.width / 2;

    const x = Math.max(
      viewportPadding + toolbarWidth / 2,
      Math.min(
        centerX,
        window.innerWidth -
          viewportPadding -
          toolbarWidth / 2
      )
    );

    const canPlaceAbove =
      rect.top >
      toolbarHeight + gap + viewportPadding;

    const y = canPlaceAbove
      ? rect.top - gap
      : Math.max(
          viewportPadding,
          Math.min(
            rect.bottom + gap,
            window.innerHeight -
              toolbarHeight -
              viewportPadding
          )
        );

    selectionRef.current = range.cloneRange();

    setPopup({
      visible: true,
      x,
      y,
      placement: canPlaceAbove ? 'top' : 'bottom',
    });
  };

  // ==========================================================
  // SELECTION LISTENERS
  // ==========================================================

  useEffect(() => {
    const scheduleSelectionUpdate = () => {
      if (selectionFrameRef.current !== null) {
        cancelAnimationFrame(selectionFrameRef.current);
      }

      selectionFrameRef.current = requestAnimationFrame(() => {
        selectionFrameRef.current = null;

        saveSelection();
        updateActiveFormats();
        updatePopupPosition();
      });
    };

    const handleSelectionChange = () => {
      scheduleSelectionUpdate();
    };

    const handlePointerUp = () => {
      isSelectingRef.current = false;
      scheduleSelectionUpdate();
    };

    const handlePointerCancel = () => {
      isSelectingRef.current = false;
    };

    const handleOutsideClick = (event) => {
      const clickedEditor =
        editorRef.current?.contains(event.target);

      const clickedToolbar =
        toolbarRef.current?.contains(event.target);

      const clickedPopup =
        popupRef.current?.contains(event.target);

      const clickedMenu =
        menuRef.current?.contains(event.target);

      if (
        !clickedEditor &&
        !clickedToolbar &&
        !clickedPopup &&
        !clickedMenu
      ) {
        hidePopup();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        hidePopup();
      }
    };

    const handleScroll = () => {
      setOpenMenu(null);
      scheduleSelectionUpdate();
    };

    const handleResize = () => {
      setOpenMenu(null);
      scheduleSelectionUpdate();
    };

    document.addEventListener(
      'selectionchange',
      handleSelectionChange
    );

    document.addEventListener(
      'pointerup',
      handlePointerUp
    );

    document.addEventListener(
      'pointercancel',
      handlePointerCancel
    );

    document.addEventListener(
      'pointerdown',
      handleOutsideClick
    );

    document.addEventListener(
      'keydown',
      handleEscape
    );

    window.addEventListener(
      'scroll',
      handleScroll,
      true
    );

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      if (selectionFrameRef.current !== null) {
        cancelAnimationFrame(selectionFrameRef.current);
        selectionFrameRef.current = null;
      }

      document.removeEventListener(
        'selectionchange',
        handleSelectionChange
      );

      document.removeEventListener(
        'pointerup',
        handlePointerUp
      );

      document.removeEventListener(
        'pointercancel',
        handlePointerCancel
      );

      document.removeEventListener(
        'pointerdown',
        handleOutsideClick
      );

      document.removeEventListener(
        'keydown',
        handleEscape
      );

      window.removeEventListener(
        'scroll',
        handleScroll,
        true
      );

      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  // ==========================================================
  // MENU POSITION
  // ==========================================================

  useEffect(() => {
    if (!openMenu || !popup.visible) return;

    const toolbar = popupRef.current;
    const menu = menuRef.current;

    if (!toolbar || !menu) return;

    const toolbarRect = toolbar.getBoundingClientRect();

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    const padding = 12;
    const gap = 8;

    const left = Math.max(
      padding,
      Math.min(
        toolbarRect.right - menuWidth,
        window.innerWidth - menuWidth - padding
      )
    );

    const spaceAbove = toolbarRect.top - padding;
    const spaceBelow =
      window.innerHeight - toolbarRect.bottom - padding;

    const preferredAbove = popup.placement === 'top';

    let top;

    if (
      (preferredAbove && spaceAbove >= menuHeight + gap) ||
      (
        spaceBelow < menuHeight + gap &&
        spaceAbove > spaceBelow
      )
    ) {
      top = toolbarRect.top - menuHeight - gap;
    } else {
      top = toolbarRect.bottom + gap;
    }

    top = Math.max(
      padding,
      Math.min(
        top,
        window.innerHeight - menuHeight - padding
      )
    );

    setMenuPosition({
      top,
      left,
    });
  }, [openMenu, popup.visible, popup.x, popup.y, popup.placement]);

  // ==========================================================
  // SAVE CONTENT
  // ==========================================================

  const saveContent = () => {
    const editor = editorRef.current;

    if (!editor) return;

    const html = sanitizeHTML(editor.innerHTML);
    const plainText = getPlainText(html);

    onChange(html, plainText);
  };

  // ==========================================================
  // FORMATTING COMMANDS
  // ==========================================================

  const executeCommand = (
    command,
    value = null
  ) => {
    if (!restoreSelection()) return;

    try {
      document.execCommand(
        command,
        false,
        value
      );
    } catch {
      return;
    }

    saveSelection();
    updateActiveFormats();
    saveContent();
    updatePopupPosition();
  };

  const changeHeading = (value) => {
    executeCommand('formatBlock', value);

    setHeading(value);
    setOpenMenu(null);
  };

  const changeTextColor = (color) => {
    executeCommand('foreColor', color);

    setTextColor(color);
    setOpenMenu(null);
  };

  const changeHighlightColor = (color) => {
    executeCommand('hiliteColor', color);

    setHighlightColor(color);
    setOpenMenu(null);
  };

  const removeHighlight = () => {
    executeCommand('hiliteColor', 'transparent');

    setHighlightColor('transparent');
    setOpenMenu(null);
  };

  const clearFormatting = () => {
    executeCommand('removeFormat');
    executeCommand('formatBlock', 'p');
    executeCommand('hiliteColor', 'transparent');

    setHeading('p');
    setTextColor('#191919');
    setHighlightColor('#F9E58B');
    setOpenMenu(null);
  };

  const toggleMenu = (menu) => {
    saveSelection();

    setOpenMenu((previous) =>
      previous === menu ? null : menu
    );
  };

  // ==========================================================
  // EDITOR EVENTS
  // ==========================================================

  const handleInput = () => {
    saveSelection();
    updateActiveFormats();
    saveContent();
    updatePopupPosition();
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const text =
      event.clipboardData.getData('text/plain');

    saveSelection();

    executeCommand('insertText', text);
  };

  const handleKeyDown = (event) => {
    const modifier =
      event.ctrlKey || event.metaKey;

    if (!modifier) return;

    const shortcuts = {
      b: 'bold',
      i: 'italic',
      u: 'underline',
    };

    const key = event.key.toLowerCase();

    if (shortcuts[key]) {
      event.preventDefault();

      saveSelection();
      executeCommand(shortcuts[key]);
    }
  };

  const handleEditorPointerDown = (event) => {
    if (event.pointerType === 'mouse') {
      isSelectingRef.current = true;
    }

    hidePopup();
  };

  // ==========================================================
  // FLOATING TOOLBAR
  // ==========================================================

  const floatingToolbar = popup.visible
    ? createPortal(
        <div
          ref={popupRef}
          role="toolbar"
          aria-label="Selected text formatting"
          onMouseDown={(event) => event.preventDefault()}
          className="
            note-floating-toolbar
            fixed z-[9999]
            w-[350px] max-w-[calc(100vw-24px)]
            rounded-xl border border-[#D8C4AD]
            bg-[#FAEBD7]/95 p-1.5
            shadow-[0_8px_30px_rgba(60,40,20,0.18)]
            backdrop-blur-xl
          "
          style={{
            left: popup.x,
            top: popup.y,
            transform:
              popup.placement === 'top'
                ? 'translate(-50%, -100%)'
                : 'translateX(-50%)',
          }}
        >
          {/* POPUP ARROW */}

          <div
            className={`
              pointer-events-none absolute
              left-1/2 h-2.5 w-2.5
              -translate-x-1/2 rotate-45
              border-[#D8C4AD] bg-[#FAEBD7]
              ${
                popup.placement === 'top'
                  ? '-bottom-[6px] border-b border-r'
                  : '-top-[6px] border-l border-t'
              }
            `}
          />

          <div className="relative flex flex-wrap items-center justify-center gap-0.5">

            {/* TEXT STYLE */}

            <button
              type="button"
              title="Text style"
              aria-label="Text style"
              aria-expanded={openMenu === 'heading'}
              onClick={() => toggleMenu('heading')}
              className={`
                flex h-8 shrink-0 items-center gap-1
                rounded-md px-2 text-[#675C50]
                transition-colors
                ${
                  openMenu === 'heading'
                    ? 'bg-[#FCE0CA] text-[#F36B21]'
                    : 'hover:bg-[#EAD5BD]'
                }
              `}
            >
              <span className="text-base font-semibold tracking-tight">
                Aa
              </span>

              <ChevronDown size={10} />
            </button>

            <ToolbarDivider />

            {/* BOLD */}

            <ToolbarButton
              icon={Bold}
              title="Bold"
              active={activeFormats.bold}
              onClick={() => executeCommand('bold')}
            />

            {/* ITALIC */}

            <ToolbarButton
              icon={Italic}
              title="Italic"
              active={activeFormats.italic}
              onClick={() => executeCommand('italic')}
            />

            {/* UNDERLINE */}

            <ToolbarButton
              icon={Underline}
              title="Underline"
              active={activeFormats.underline}
              onClick={() => executeCommand('underline')}
            />

            {/* STRIKETHROUGH */}

            <ToolbarButton
              icon={Strikethrough}
              title="Strikethrough"
              active={activeFormats.strikeThrough}
              onClick={() => executeCommand('strikeThrough')}
            />

            <ToolbarDivider />

            {/* TEXT COLOR */}

            <button
              type="button"
              title="Text color"
              aria-label="Text color"
              aria-expanded={openMenu === 'textColor'}
              onClick={() => toggleMenu('textColor')}
              className={`
                flex h-8 w-8 shrink-0 flex-col
                items-center justify-center
                rounded-md transition-colors
                ${
                  openMenu === 'textColor'
                    ? 'bg-[#FCE0CA]'
                    : 'hover:bg-[#EAD5BD]'
                }
              `}
            >
              <span className="text-sm font-bold leading-none text-[#675C50]">
                A
              </span>

              <span
                className="mt-0.5 h-[3px] w-4 rounded-full"
                style={{
                  backgroundColor: textColor,
                }}
              />
            </button>

            {/* HIGHLIGHT */}

            <button
              type="button"
              title="Highlight color"
              aria-label="Highlight color"
              aria-expanded={openMenu === 'highlight'}
              onClick={() => toggleMenu('highlight')}
              className={`
                flex h-8 w-8 shrink-0 flex-col
                items-center justify-center
                rounded-md transition-colors
                ${
                  openMenu === 'highlight'
                    ? 'bg-[#FCE0CA]'
                    : 'hover:bg-[#EAD5BD]'
                }
              `}
            >
              <Highlighter
                size={15}
                className="text-[#675C50]"
              />

              <span
                className="mt-0.5 h-[3px] w-4 rounded-full"
                style={{
                  backgroundColor: highlightColor,
                }}
              />
            </button>

            <ToolbarDivider />

            {/* MORE OPTIONS */}

            <ToolbarButton
              icon={MoreHorizontal}
              title="More formatting"
              active={openMenu === 'more'}
              onClick={() => toggleMenu('more')}
            />
          </div>
        </div>,
        document.body
      )
    : null;

  // ==========================================================
  // FLOATING SUBMENU
  // ==========================================================

  const floatingMenu =
    popup.visible && openMenu
      ? createPortal(
          <div
            ref={menuRef}
            onMouseDown={(event) => event.preventDefault()}
            className="
              note-format-menu fixed z-[10000]
              w-[220px] max-w-[calc(100vw-24px)]
              max-h-[calc(100dvh-24px)]
              overflow-y-auto rounded-xl
              border border-[#D8C4AD]
              bg-[#FAEBD7]
              shadow-[0_8px_30px_rgba(60,40,20,0.18)]
            "
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            {/* HEADING MENU */}

            {openMenu === 'heading' && (
              <div className="p-2">
                <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[#A39280]">
                  Text Style
                </p>

                {HEADING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      changeHeading(option.value)
                    }
                    className={`
                      flex w-full items-center
                      justify-between rounded-lg
                      px-3 py-2.5 text-left
                      transition-colors
                      ${
                        heading === option.value
                          ? 'bg-[#FCE0CA] text-[#F36B21]'
                          : 'text-[#191919] hover:bg-[#F5E4CF]'
                      }
                    `}
                  >
                    <span className={option.className}>
                      {option.label}
                    </span>

                    {heading === option.value && (
                      <Check size={14} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* TEXT COLOR MENU */}

            {openMenu === 'textColor' && (
              <ColorMenu
                title="Text Color"
                colors={TEXT_COLORS}
                selectedColor={textColor}
                onSelect={changeTextColor}
                onReset={() => changeTextColor('#191919')}
                resetLabel="Reset Text Color"
              />
            )}

            {/* HIGHLIGHT MENU */}

            {openMenu === 'highlight' && (
              <ColorMenu
                title="Highlight Color"
                colors={HIGHLIGHT_COLORS}
                selectedColor={highlightColor}
                onSelect={changeHighlightColor}
                onReset={removeHighlight}
                resetLabel="Remove Highlight"
                isHighlight
              />
            )}

            {/* MORE FORMATTING */}

            {openMenu === 'more' && (
              <div className="p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#857665]">
                  Alignment
                </p>

                <div className="flex items-center justify-between rounded-lg bg-[#F5E4CF] p-1">
                  <ToolbarButton
                    icon={AlignLeft}
                    title="Align left"
                    active={activeFormats.justifyLeft}
                    onClick={() => executeCommand('justifyLeft')}
                  />

                  <ToolbarButton
                    icon={AlignCenter}
                    title="Align center"
                    active={activeFormats.justifyCenter}
                    onClick={() => executeCommand('justifyCenter')}
                  />

                  <ToolbarButton
                    icon={AlignRight}
                    title="Align right"
                    active={activeFormats.justifyRight}
                    onClick={() => executeCommand('justifyRight')}
                  />

                  <ToolbarButton
                    icon={AlignJustify}
                    title="Justify"
                    active={activeFormats.justifyFull}
                    onClick={() => executeCommand('justifyFull')}
                  />
                </div>

                <div className="my-3 h-px bg-[#D8C4AD]" />

                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#857665]">
                  Formatting
                </p>

                {[
                  {
                    icon: List,
                    label: 'Bullet List',
                    command: 'insertUnorderedList',
                  },
                  {
                    icon: ListOrdered,
                    label: 'Numbered List',
                    command: 'insertOrderedList',
                  },
                  {
                    icon: Quote,
                    label: 'Blockquote',
                    command: 'formatBlock',
                    value: 'blockquote',
                  },
                  {
                    icon: Minus,
                    label: 'Divider',
                    command: 'insertHorizontalRule',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        executeCommand(
                          item.command,
                          item.value || null
                        );

                        setOpenMenu(null);
                      }}
                      className="
                        flex w-full items-center gap-3
                        rounded-lg px-2 py-2.5
                        text-left text-xs font-medium
                        text-[#675C50]
                        hover:bg-[#F5E4CF]
                      "
                    >
                      <Icon size={15} />
                      {item.label}
                    </button>
                  );
                })}

                <div className="my-2 h-px bg-[#D8C4AD]" />

                <button
                  type="button"
                  onClick={clearFormatting}
                  className="
                    flex w-full items-center gap-3
                    rounded-lg px-2 py-2.5
                    text-xs font-medium text-[#C7503E]
                    hover:bg-[#C7503E]/10
                  "
                >
                  <Eraser size={15} />
                  Clear Formatting
                </button>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  // ==========================================================
  // EDITOR RENDER
  // ==========================================================

  return (
    <div className="flex min-w-0 flex-1 flex-col">

      {/* MINIMAL EDITOR TOOLBAR */}

      <div
        ref={toolbarRef}
        className="
          mb-4 flex flex-wrap items-center
          gap-1 rounded-lg border border-[#D8C4AD]
          bg-[#F5E4CF] px-2 py-1.5
        "
      >
        <ToolbarButton
          icon={Undo2}
          title="Undo"
          onClick={() => executeCommand('undo')}
        />

        <ToolbarButton
          icon={Redo2}
          title="Redo"
          onClick={() => executeCommand('redo')}
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={List}
          title="Bullet list"
          active={activeFormats.insertUnorderedList}
          onClick={() => executeCommand('insertUnorderedList')}
        />

        <ToolbarButton
          icon={ListOrdered}
          title="Numbered list"
          active={activeFormats.insertOrderedList}
          onClick={() => executeCommand('insertOrderedList')}
        />

        <ToolbarButton
          icon={Minus}
          title="Insert divider"
          onClick={() => executeCommand('insertHorizontalRule')}
        />

        <span className="ml-auto hidden px-2 text-[10px] text-[#A39280] sm:block">
          Select text to format
        </span>
      </div>

      {/* FLOATING FORMATTING POPUP */}

      {floatingToolbar}

      {/* FORMATTING SUBMENU */}

      {floatingMenu}

      {/* EDITABLE CONTENT */}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Note content"
        aria-multiline="true"
        spellCheck
        data-placeholder="Start writing..."
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onPointerDown={handleEditorPointerDown}
        onDrop={(event) => event.preventDefault()}
        onKeyUp={() => {
          saveSelection();
          updateActiveFormats();
          updatePopupPosition();
        }}
        onTouchEnd={() => {
          requestAnimationFrame(() => {
            saveSelection();
            updateActiveFormats();
            updatePopupPosition();
          });
        }}
        className="
          rich-note-editor
          min-h-[350px] w-full min-w-0 flex-1
          break-words bg-transparent
          px-1 py-2 text-sm leading-7
          text-[#191919] outline-none
        "
      />
    </div>
  );
}

// ============================================================
// NOTES COMPONENT
// ============================================================

function Notes({
  notes = [],
  setNotes,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const titleRef = useRef(null);

  const selectedNote = notes.find(
    (note) => note.id === selectedId
  );

  // ==========================================================
  // CREATE NOTE
  // ==========================================================

  const createNote = () => {
    const timestamp = new Date().toISOString();

    const note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      contentHtml: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setNotes((previous) => [
      note,
      ...previous,
    ]);

    setSearch('');
    setSelectedId(note.id);
  };

  // ==========================================================
  // UPDATE NOTE
  // ==========================================================

  const updateNote = (field, value) => {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === selectedId
          ? {
              ...note,
              [field]: value,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  };

  // ==========================================================
  // UPDATE RICH TEXT CONTENT
  // ==========================================================

  const updateNoteContent = (html, plainText) => {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === selectedId
          ? {
              ...note,
              contentHtml: html,
              content: plainText,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  };

  // ==========================================================
  // DELETE NOTE
  // ==========================================================

  const deleteNote = (id) => {
    if (!window.confirm('Delete this note?')) {
      return;
    }

    setNotes((previous) =>
      previous.filter((note) => note.id !== id)
    );

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  // ==========================================================
  // FILTER NOTES
  // ==========================================================

  const filteredNotes = notes
    .filter((note) => {
      const query = search.trim().toLowerCase();

      return (
        (note.title || '')
          .toLowerCase()
          .includes(query) ||
        getNotePreview(note)
          .toLowerCase()
          .includes(query)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0) -
        new Date(a.updatedAt || 0)
    );

  // ==========================================================
  // FOCUS NEW NOTE TITLE
  // ==========================================================

  useEffect(() => {
    if (
      selectedNote &&
      !selectedNote.title &&
      !selectedNote.content
    ) {
      titleRef.current?.focus({
        preventScroll: true,
      });
    }
  }, [selectedId]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8 text-[#191919]">

      {/* ======================================================
          RICH TEXT STYLES
      ====================================================== */}

      <style>{`
        .rich-note-editor {
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          caret-color: #F36B21;
          user-select: text;
          -webkit-user-select: text;
        }

        .rich-note-editor:empty::before {
          content: attr(data-placeholder);
          color: #B5A28E;
          pointer-events: none;
        }

        .rich-note-editor ::selection {
          background: rgba(243, 107, 33, 0.25);
        }

        .rich-note-editor h1 {
          font-size: 1.85rem;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: -0.035em;
          margin: 1rem 0 0.5rem;
        }

        .rich-note-editor h2 {
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.4;
          letter-spacing: -0.025em;
          margin: 0.9rem 0 0.4rem;
        }

        .rich-note-editor h3 {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.5;
          margin: 0.7rem 0 0.3rem;
        }

        .rich-note-editor p {
          margin: 0.35rem 0;
          min-height: 1.75rem;
        }

        .rich-note-editor b,
        .rich-note-editor strong {
          font-weight: 700;
        }

        .rich-note-editor i,
        .rich-note-editor em {
          font-style: italic;
        }

        .rich-note-editor u {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .rich-note-editor s,
        .rich-note-editor strike,
        .rich-note-editor del {
          text-decoration: line-through;
        }

        .rich-note-editor ul {
          list-style-type: disc;
          padding-left: 1.6rem;
          margin: 0.5rem 0;
        }

        .rich-note-editor ol {
          list-style-type: decimal;
          padding-left: 1.6rem;
          margin: 0.5rem 0;
        }

        .rich-note-editor li {
          display: list-item;
          padding-left: 0.2rem;
          margin: 0.15rem 0;
        }

        .rich-note-editor ul ul {
          list-style-type: circle;
        }

        .rich-note-editor ol ol {
          list-style-type: lower-alpha;
        }

        .rich-note-editor blockquote {
          margin: 1rem 0;
          padding: 0.5rem 0.9rem;
          border-left: 3px solid #F36B21;
          background: rgba(243, 107, 33, 0.06);
          color: #857665;
          font-style: italic;
          border-radius: 0 6px 6px 0;
        }

        .rich-note-editor hr {
          border: 0;
          border-top: 1px solid #D8C4AD;
          margin: 1.5rem 0;
        }

        .rich-note-editor mark {
          background-color: #F9E58B;
          color: inherit;
        }

        .rich-note-editor > :first-child {
          margin-top: 0;
        }

        @keyframes noteToolbarAppear {
          from {
            opacity: 0;
            scale: 0.96;
          }

          to {
            opacity: 1;
            scale: 1;
          }
        }

        .note-floating-toolbar {
          animation: noteToolbarAppear 150ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .note-format-menu {
          animation: noteToolbarAppear 120ms
            ease-out both;
        }

        .notes-list-scroll {
          scrollbar-width: thin;
          scrollbar-color: #D8C4AD transparent;
        }

        .notes-list-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .notes-list-scroll::-webkit-scrollbar-thumb {
          background-color: #D8C4AD;
          border-radius: 999px;
        }

        @media (prefers-reduced-motion: reduce) {
          .note-floating-toolbar,
          .note-format-menu {
            animation: none;
          }
        }
      `}</style>

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8C4AD] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Notes
            <span className="text-[#F36B21]">.</span>
          </h2>

          <p className="mt-1 text-xs text-[#857665]">
            {notes.length} saved {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>

        <button
          type="button"
          onClick={createNote}
          className="
            inline-flex items-center gap-2
            rounded-lg bg-[#F36B21]
            px-5 py-3 text-xs font-bold text-white
            transition-colors hover:bg-[#DC5814]
          "
        >
          <Plus size={17} />
          New Note
        </button>
      </div>

      {/* NOTES WORKSPACE */}

      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">

        {/* ====================================================
            NOTES LIST
        ==================================================== */}

        <section className="min-w-0 overflow-hidden rounded-xl border border-[#D8C4AD] bg-[#FAEBD7]">

          {/* SEARCH */}

          <div className="border-b border-[#D8C4AD] p-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#857665]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search notes..."
                aria-label="Search notes"
                className="
                  w-full rounded-lg
                  border border-[#D8C4AD]
                  bg-[#F5E4CF]
                  py-2.5 pl-10 pr-3
                  text-xs text-[#191919]
                  outline-none
                  transition-colors
                  focus:border-[#F36B21]
                "
              />
            </div>
          </div>

          {/* NOTES LIST */}

          <div className="notes-list-scroll max-h-[300px] overflow-y-auto lg:max-h-[620px]">
            {filteredNotes.map((note) => {
              const selected =
                selectedId === note.id;

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  aria-pressed={selected}
                  className={`
                    flex w-full min-w-0 flex-col
                    border-b border-[#D8C4AD]
                    border-l-[3px]
                    px-4 py-4 text-left
                    transition-colors
                    last:border-b-0
                    ${
                      selected
                        ? 'border-l-[#F36B21] bg-[#F5E4CF]'
                        : 'border-l-transparent hover:bg-[#F5E4CF]'
                    }
                  `}
                >
                  <p className="w-full truncate text-sm font-semibold text-[#191919]">
                    {note.title || 'Untitled Note'}
                  </p>

                  <p className="mt-1 w-full truncate text-xs text-[#857665]">
                    {getNotePreview(note) || 'Empty note'}
                  </p>

                  <p className="mt-2 text-[10px] text-[#A39280]">
                    {formatNoteDate(note.updatedAt)}
                  </p>
                </button>
              );
            })}

            {/* EMPTY NOTES */}

            {!filteredNotes.length && (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center">
                <StickyNote
                  size={25}
                  className="text-[#F36B21]"
                />

                <p className="mt-3 text-xs font-semibold text-[#857665]">
                  {search
                    ? 'No matching notes'
                    : 'No notes found'}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-3 text-[11px] font-semibold text-[#F36B21]"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            NOTE EDITOR
        ==================================================== */}

        <section className="flex min-h-[560px] min-w-0 flex-col rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-7">

          {selectedNote ? (
            <>
              {/* EDITOR HEADER */}

              <div className="mb-6 flex items-center justify-between border-b border-[#D8C4AD] pb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-[#176D70]">
                  <Check size={15} />
                  Saved automatically
                </div>

                <button
                  type="button"
                  onClick={() =>
                    deleteNote(selectedNote.id)
                  }
                  className="
                    rounded-md p-2 text-[#857665]
                    transition-colors
                    hover:bg-[#C7503E]/10
                    hover:text-[#C7503E]
                  "
                  aria-label="Delete note"
                  title="Delete note"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* NOTE TITLE */}

              <input
                ref={titleRef}
                value={selectedNote.title || ''}
                onChange={(event) =>
                  updateNote(
                    'title',
                    event.target.value
                  )
                }
                placeholder="Note title"
                aria-label="Note title"
                className="
                  w-full bg-transparent
                  text-2xl font-bold tracking-tight
                  text-[#191919] outline-none
                  placeholder:text-[#B5A28E]
                  sm:text-3xl
                "
              />

              {/* DATE */}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[#A39280]">
                <CalendarDays size={13} />

                <span>
                  {formatNoteDate(selectedNote.updatedAt)}
                </span>
              </div>

              {/* DIVIDER */}

              <div className="my-5 h-px bg-[#D8C4AD]" />

              {/* RICH TEXT EDITOR */}

              <RichTextEditor
                key={selectedNote.id}
                note={selectedNote}
                onChange={updateNoteContent}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">

              {/* EMPTY EDITOR */}

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D8C4AD] bg-[#F5E4CF]">
                <StickyNote
                  size={29}
                  strokeWidth={1.7}
                  className="text-[#F36B21]"
                />
              </div>

              <h3 className="mt-4 text-lg font-bold">
                Select a note
              </h3>

              <p className="mt-2 text-xs text-[#857665]">
                Or create a new one.
              </p>

              <button
                type="button"
                onClick={createNote}
                className="
                  mt-5 inline-flex items-center gap-2
                  rounded-lg bg-[#F36B21]
                  px-5 py-3 text-xs font-bold text-white
                  transition-colors hover:bg-[#DC5814]
                "
              >
                <Plus size={16} />
                Create Note
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Notes;