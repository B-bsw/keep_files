"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@heroui/react";
import { Copy, Trash2, Link, Check, LoaderCircle } from "lucide-react";
import { FileData, ShareLink } from "../../types";
import { toast } from "@heroui/react";

type ShareModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: FileData | null;
};

export function ShareModal({ isOpen, onOpenChange, file }: ShareModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [permission, setPermission] = useState<"VIEW" | "DOWNLOAD">("DOWNLOAD");
  const [expiry, setExpiry] = useState<"never" | "1d" | "7d" | "30d">("never");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !file) return;
    setLoading(true);
    fetch(`/api/share/file/${file.id}`)
      .then((r) => r.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, [isOpen, file]);

  const shareUrl = (token: string) => `${window.location.origin}/share/${token}`;

  const handleCopy = (link: ShareLink) => {
    navigator.clipboard.writeText(shareUrl(link.token));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    if (!file) return;
    setCreating(true);
    try {
      const expiresAt =
        expiry === "never"
          ? undefined
          : new Date(Date.now() + { "1d": 1, "7d": 7, "30d": 30 }[expiry] * 86400000).toISOString();

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, permission, expiresAt }),
      });
      if (!res.ok) throw new Error();
      const newLink = await res.json();
      setLinks((prev) => [newLink, ...prev]);
      toast("Share link created");
    } catch {
      toast("Failed to create share link", { variant: "danger" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!file) return;
    const res = await fetch(`/api/share/file/${file.id}?linkId=${linkId}`, { method: "DELETE" });
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      toast("Share link deleted");
    } else {
      toast("Failed to delete link", { variant: "danger" });
    }
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return "Never expires";
    const d = new Date(expiresAt);
    if (d < new Date()) return "Expired";
    return `Expires ${d.toLocaleDateString()}`;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#050505] rounded-lg w-full max-w-md">
            <Modal.CloseTrigger className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
            <Modal.Header>
              <Modal.Heading className="text-gray-900 dark:text-white text-lg font-semibold flex items-center gap-2">
                <Link className="w-5 h-5" />
                Share File
              </Modal.Heading>
              {file && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{file.originalName}</p>
              )}
            </Modal.Header>

            <Modal.Body className="space-y-4">
              {/* Create new link */}
              <div className="border border-gray-200 dark:border-[#222222] rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">New Link</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Permission</p>
                    <div className="flex gap-1">
                      {(["VIEW", "DOWNLOAD"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPermission(p)}
                          className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                            permission === p
                              ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                              : "border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-[#555]"
                          }`}
                        >
                          {p === "VIEW" ? "View only" : "Download"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Expires</p>
                    <select
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value as typeof expiry)}
                      className="w-full py-1.5 px-2 text-xs rounded-md border border-gray-200 dark:border-[#333] bg-[#F5FEFD] dark:bg-[#111] text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      <option value="never">Never</option>
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                    </select>
                  </div>
                </div>
                <Button
                  onPress={handleCreate}
                  isPending={creating}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-white/90 rounded-lg text-sm py-2"
                >
                  {creating ? <LoaderCircle className="animate-spin-fast w-4 h-4" /> : "Create Link"}
                </Button>
              </div>

              {/* Existing links */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <LoaderCircle className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : links.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Active Links</p>
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-[#222] bg-white dark:bg-[#111]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                          {shareUrl(link.token)}
                        </p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {link.permission === "VIEW" ? "View only" : "Download"}
                          </span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-400">{formatExpiry(link.expiresAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(link)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 transition-colors"
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Delete link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">No share links yet</p>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                slot="close"
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#151515] border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#111111] rounded-lg"
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
