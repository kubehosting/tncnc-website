"use client";

import { KeyboardEvent, useState } from "react";

export type EditorChild = { uid: string; name: string; original: string | null; count: number };
export type EditorNode = EditorChild & { children: EditorChild[] };

let nextUid = 0;
export function editorUid() {
  nextUid += 1;
  return `node-${nextUid}`;
}

export function toEditorTree(
  nodes: { name: string; count: number; children: { name: string; count: number }[] }[],
): EditorNode[] {
  return nodes.map((node) => ({
    uid: editorUid(),
    name: node.name,
    original: node.name,
    count: node.count,
    children: node.children.map((child) => ({
      uid: editorUid(),
      name: child.name,
      original: child.name,
      count: child.count,
    })),
  }));
}

export function fromEditorTree(tree: EditorNode[]) {
  return tree
    .filter((node) => node.name.trim())
    .map((node) => ({
      name: node.name.trim(),
      original: node.original,
      children: node.children
        .filter((child) => child.name.trim())
        .map((child) => ({ name: child.name.trim(), original: child.original })),
    }));
}

const input =
  "min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none ring-gold focus:ring-2";

function confirmRemoval(label: string, count: number, extra = "") {
  if (count === 0) {
    return true;
  }
  return window.confirm(
    `${count} product${count === 1 ? " uses" : "s use"} “${label}”. Removing it clears it from ${
      count === 1 ? "that product" : "those products"
    }${extra} when you save. Continue?`,
  );
}

function AddRow({
  placeholder,
  buttonLabel,
  onAdd,
  small = false,
}: {
  placeholder: string;
  buttonLabel: string;
  onAdd: (name: string) => boolean;
  small?: boolean;
}) {
  const [value, setValue] = useState("");
  function submit() {
    const name = value.trim();
    if (name && onAdd(name)) {
      setValue("");
    }
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`${input} ${small ? "py-1 text-[13px]" : ""}`}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        className={`shrink-0 rounded-lg border border-slate-200 bg-white font-semibold text-navy hover:border-gold disabled:opacity-50 ${
          small ? "px-2.5 text-xs" : "px-3 text-sm"
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500"
      title={`${count} product${count === 1 ? "" : "s"}`}
    >
      {count}
    </span>
  );
}

export function SubcategoryEditor({
  tree,
  onChange,
}: {
  tree: EditorNode[];
  onChange: (tree: EditorNode[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const hasName = (list: { uid: string; name: string }[], name: string, except?: string) =>
    list.some((item) => item.uid !== except && item.name.trim().toLowerCase() === name.trim().toLowerCase());

  function updateNode(uid: string, patch: (node: EditorNode) => EditorNode) {
    onChange(tree.map((node) => (node.uid === uid ? patch(node) : node)));
  }

  function addSub(name: string) {
    if (hasName(tree, name)) {
      setNotice(`“${name}” is already a subcategory.`);
      return false;
    }
    const uid = editorUid();
    onChange([...tree, { uid, name, original: null, count: 0, children: [] }]);
    setExpanded(uid);
    setNotice("");
    return true;
  }

  function addChild(node: EditorNode, name: string) {
    if (hasName(node.children, name)) {
      setNotice(`“${name}” is already under ${node.name}.`);
      return false;
    }
    updateNode(node.uid, (current) => ({
      ...current,
      children: [...current.children, { uid: editorUid(), name, original: null, count: 0 }],
    }));
    setNotice("");
    return true;
  }

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 px-3 py-2.5">
        <p className="text-sm font-medium text-slate-700">Subcategories &amp; child categories</p>
        <p className="text-xs text-slate-500">
          Used for the website filters and menu. Renaming here updates every product that uses the name.
        </p>
      </div>

      <div className="max-h-[26rem] space-y-2 overflow-y-auto p-3">
        {tree.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
            No subcategories yet. Add one below, or import products with a subcategory column.
          </p>
        ) : null}

        {tree.map((node) => {
          const open = expanded === node.uid;
          const duplicate = hasName(tree, node.name, node.uid);
          return (
            <div key={node.uid} className="rounded-lg border border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-1.5 p-2">
                <button
                  type="button"
                  aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : node.uid)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded text-xs text-slate-500 hover:bg-white"
                >
                  <span className={`transition ${open ? "rotate-90" : ""}`}>▶</span>
                </button>
                <input
                  value={node.name}
                  aria-label="Subcategory name"
                  onChange={(event) => updateNode(node.uid, (current) => ({ ...current, name: event.target.value }))}
                  className={`${input} ${!node.name.trim() ? "border-rose-300" : duplicate ? "border-amber-300" : ""}`}
                />
                <CountBadge count={node.count} />
                <button
                  type="button"
                  aria-label={`Remove ${node.name}`}
                  onClick={() => {
                    if (confirmRemoval(node.original ?? node.name, node.count, " along with its child categories")) {
                      onChange(tree.filter((item) => item.uid !== node.uid));
                    }
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  ✕
                </button>
              </div>
              {duplicate ? (
                <p className="-mt-1 mb-2 ml-10 text-[11px] text-amber-700">
                  Same name as another subcategory. They are merged when you save.
                </p>
              ) : null}
              {!open && node.children.length ? (
                <button
                  type="button"
                  onClick={() => setExpanded(node.uid)}
                  className="mb-2 ml-10 text-left text-xs text-slate-500 hover:text-navy"
                >
                  {node.children.length} child categor{node.children.length === 1 ? "y" : "ies"}:{" "}
                  {node.children
                    .slice(0, 3)
                    .map((child) => child.name)
                    .join(", ")}
                  {node.children.length > 3 ? "…" : ""}
                </button>
              ) : null}
              {open ? (
                <div className="space-y-1.5 border-t border-slate-200 px-2 pb-2 pt-2 sm:pl-10">
                  {node.children.map((child) => {
                    const childDuplicate = hasName(node.children, child.name, child.uid);
                    return (
                      <div key={child.uid} className="flex items-center gap-1.5">
                        <span className="text-slate-300" aria-hidden>
                          └
                        </span>
                        <input
                          value={child.name}
                          aria-label="Child category name"
                          onChange={(event) =>
                            updateNode(node.uid, (current) => ({
                              ...current,
                              children: current.children.map((item) =>
                                item.uid === child.uid ? { ...item, name: event.target.value } : item,
                              ),
                            }))
                          }
                          className={`${input} py-1 text-[13px] ${
                            !child.name.trim() ? "border-rose-300" : childDuplicate ? "border-amber-300" : ""
                          }`}
                        />
                        <CountBadge count={child.count} />
                        <button
                          type="button"
                          aria-label={`Remove ${child.name}`}
                          onClick={() => {
                            if (confirmRemoval(child.original ?? child.name, child.count)) {
                              updateNode(node.uid, (current) => ({
                                ...current,
                                children: current.children.filter((item) => item.uid !== child.uid),
                              }));
                            }
                          }}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  <AddRow
                    small
                    placeholder={`New child category under ${node.name || "this subcategory"}`}
                    buttonLabel="Add"
                    onAdd={(name) => addChild(node, name)}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5 border-t border-slate-100 p-3">
        <AddRow placeholder="New subcategory, e.g. CNC Lathe" buttonLabel="Add subcategory" onAdd={addSub} />
        {notice ? <p className="text-xs text-rose-600">{notice}</p> : null}
      </div>
    </div>
  );
}
