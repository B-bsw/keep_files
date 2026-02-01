"use client";

import { Loader, RefreshCcw, X } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { handleUpload, handleDelete, getFiles } from "@/app/actions";

type Files = {
  id: string; // Changed from number to string for Google Drive IDs
  file_name: string;
  file_path: string;
  webContentLink?: string | null;
}[];

export default function Page() {
  const [ListFiles, setListFiles] = useState<Files | null>();
  const [customFileName, setCustomFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsloading] = useState<boolean>(true);

  const inputFile = useRef<HTMLInputElement>(null);
  const inputEditFileName = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setIsloading(true);
    const data = await getFiles();
    setListFiles(data);
    setIsloading(false);
  }, []);

  //upload file
  const handleFileSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!file) {
        alert("ได้โปรดเลือกไฟล์ด้วย ถือว่าขอร้อง");
        return;
      }

      setIsloading(true);

      // Prepare file name logic
      const ext =
        file.name.split(".").pop() === "jpeg"
          ? "jpg"
          : file.name.split(".").pop();
      const beforeEditFileName = file.name.split(".");

      // Logic from provided code: if custom name exists, append extension, else use original
      let finalFileName = file.name;
      if (customFileName.trim() !== "") {
        finalFileName = `${customFileName}.${ext?.toLowerCase()}`;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("customFileName", finalFileName);

      const result = await handleUpload(formData);

      if (!result.success) {
        alert(result.error || "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลไฟล์ (หรือชื่อซ้ำ?)");
        setIsloading(false);
        return;
      }

      // reset
      setFile(null);
      setCustomFileName("");
      if (inputFile.current) inputFile.current.value = "";
      if (inputEditFileName.current) inputEditFileName.current.value = "";

      fetchFiles();
    },
    [file, customFileName, fetchFiles],
  );

  const downloadFile = useCallback(async (path: string, name: string) => {
    window.open(path, "_blank");
  }, []);

  const refresh = useCallback(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!confirm("ลบจริงหรอ?")) return;

      setIsloading(true);
      const result = await handleDelete(id);
      if (!result.success) {
        alert("ลบไม่สำเร็จ");
      }
      fetchFiles();
    },
    [fetchFiles],
  );

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const nameFile = file?.name.split(".")[0];
    if (inputEditFileName.current)
      inputEditFileName.current.value = nameFile ? nameFile : "";
  }, [file]);

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-black p-6 text-gray-300">
      <div className="w-full max-w-lg space-y-12">
        <h1 className="select-none text-center text-3xl font-light tracking-wider">
          <span className="text-cyan-400">Upload</span> File
        </h1>

        <div className="max-h-[40vh] select-none space-y-2">
          <div className="flex justify-end gap-3">
            <div className="text-sm text-sky-500">refresh button</div>
            <div
              className="w-fit cursor-pointer rounded-lg border p-0.5 transition-all ease-in hover:scale-95 hover:border-black hover:bg-white hover:text-black active:scale-75"
              onClick={refresh}
            >
              <RefreshCcw size={18} />
            </div>
          </div>
          <div className="scll max-h-[40vh] overflow-auto rounded-sm">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="w-fit animate-spin">
                  <Loader />
                </div>
              </div>
            ) : ListFiles?.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                No files uploaded yet
              </p>
            ) : (
              ListFiles?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    onClick={() => downloadFile(item.file_path, item.file_name)}
                    className="flex w-full cursor-pointer items-center justify-between border-b border-gray-800 px-4 py-3 text-sm transition-colors duration-300 hover:border-cyan-500"
                  >
                    {item.file_name}
                  </div>
                  <div
                    className="cursor-pointer rounded-lg border p-0.5 transition-all ease-in hover:scale-95 hover:border-black hover:bg-white hover:text-black active:scale-75 active:border-black active:bg-red-500 active:text-black"
                    onClick={() => onDelete(item.id)}
                  >
                    <X size={18} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => !isLoading && handleFileSubmit(e)}
          className="space-y-6"
        >
          <input
            type="text"
            disabled={file === null}
            placeholder="Edit file name (optional)"
            ref={inputEditFileName}
            onChange={(e) => setCustomFileName(e.target.value.trim())}
            className={`${file === null && "hidden"} w-full border-b border-gray-700 bg-transparent px-0 py-2 text-white placeholder-gray-600 outline-none transition-colors focus:border-cyan-400`}
          />

          <input
            ref={inputFile}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full cursor-pointer text-sm text-gray-400 transition file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500/10 file:px-6 file:py-2 file:text-sm file:font-medium file:text-cyan-400 hover:file:bg-cyan-500/20"
          />

          <button
            type="submit"
            className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-medium uppercase tracking-wider text-cyan-400 transition-all duration-300 hover:bg-cyan-500/20"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
