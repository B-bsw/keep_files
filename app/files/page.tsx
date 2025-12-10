"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Files = {
  id:number,
  file_name: string;
  user_name: string;
}[];

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [user, setUser] = useState<string>("Anonymous");
  const [ListFiles, setListFiles] = useState<Files | null>();

  const fetchFiles = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .order("id", { ascending: false })

    if (error) {
      console.error(error);
      return;
    }

    console.log("DATA:", data);
    setListFiles(data);
  };

  const handleFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    if (!file) {
      alert("เลือกไฟล์ก่อน");
      return;
    }

    const filePath = `uploads/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert("เกิดข้อผิดพลาดระหว่างอัปโหลดไฟล์  หรือ ไฟล์ซ้ำกัน");
      return;
    }

    const { error: insertError } = await supabase
      .from("files")
      .insert({
        file_name: file.name,
        file_path: filePath,
        size: file.size,
        mime: file.type,
        user_name: user,
      });

    if (insertError) {
      console.error(insertError);
      alert("เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลไฟล์");
      return;
    }

    alert("อัปโหลดสำเร็จ!");
    fetchFiles()
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen w-screen bg-black text-gray-300 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-12">

        {/* Title */}
        <h1 className="text-3xl font-light tracking-wider text-center">
          <span className="text-cyan-400">Upload</span> File
        </h1>

        {/* File List */}
        <div className="space-y-2">
          {ListFiles?.length === 0 ? (
            <p className="text-center text-gray-600 py-8 text-sm">No files uploaded yet</p>
          ) : (
            ListFiles?.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 border-b border-gray-800 hover:border-cyan-500 transition-colors duration-300 text-sm"
              >
                {item.file_name}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleFile} className="space-y-6">

          <input
            type="text"
            placeholder="Your name (optional)"
            onChange={(e) =>
              setUser(e.target.value.trim() === "" ? "Anonymous" : e.target.value)
            }
            className="w-full px-0 py-2 bg-transparent border-b border-gray-700 focus:border-cyan-400 outline-none transition-colors text-white placeholder-gray-600"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer transition"
          />

          <button
            type="submit"
            className="w-full py-3 text-sm font-medium tracking-wider uppercase bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all duration-300"
          >
            Upload
          </button>
        </form>

      </div>
    </div>
  );
}
