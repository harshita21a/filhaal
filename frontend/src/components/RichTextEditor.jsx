import React, { useRef, useEffect } from "react";
import { Bold, Italic, Heading2, Heading3, Quote, List, ListOrdered, Link2, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const Btn = ({ onClick, title, children, testId }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className="p-2 hover:bg-muted rounded-sm text-foreground transition-colors"
    data-testid={testId}
  >
    {children}
  </button>
);

export const RichTextEditor = ({ value, onChange }) => {
  const ref = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (ref.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(ref.current.innerHTML);
  const cmd = (command, arg = null) => {
    document.execCommand(command, false, arg);
    ref.current.focus();
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL");
    if (url) cmd("createLink", url);
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.url.startsWith("http") ? data.url : `${process.env.REACT_APP_BACKEND_URL}${data.url}`;
      cmd("insertHTML", `<img src="${url}" alt="" />`);
    } catch {
      toast.error("Image upload failed");
    }
    e.target.value = "";
  };

  return (
    <div className="border border-border rounded-sm bg-cream" data-testid="rich-text-editor">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 sticky top-0 bg-cream z-10">
        <Btn title="Bold" onClick={() => cmd("bold")} testId="rte-bold"><Bold size={16} /></Btn>
        <Btn title="Italic" onClick={() => cmd("italic")} testId="rte-italic"><Italic size={16} /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn title="Heading" onClick={() => cmd("formatBlock", "<h2>")} testId="rte-h2"><Heading2 size={16} /></Btn>
        <Btn title="Subheading" onClick={() => cmd("formatBlock", "<h3>")} testId="rte-h3"><Heading3 size={16} /></Btn>
        <Btn title="Quote" onClick={() => cmd("formatBlock", "<blockquote>")} testId="rte-quote"><Quote size={16} /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn title="Bullet list" onClick={() => cmd("insertUnorderedList")} testId="rte-ul"><List size={16} /></Btn>
        <Btn title="Numbered list" onClick={() => cmd("insertOrderedList")} testId="rte-ol"><ListOrdered size={16} /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn title="Link" onClick={addLink} testId="rte-link"><Link2 size={16} /></Btn>
        <Btn title="Image" onClick={() => fileRef.current.click()} testId="rte-image"><ImageIcon size={16} /></Btn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} data-testid="rte-image-input" />
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={emit}
        className="prose-editorial min-h-[280px] p-6 focus:outline-none"
        data-testid="rte-content"
        suppressContentEditableWarning
      />
    </div>
  );
};
