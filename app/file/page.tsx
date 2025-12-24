'use client'

import { createClient } from '@/lib/supabase/client'
import { Loader, RefreshCcw, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'

type Files = {
    id: number
    file_name: string
    user_name: string
    file_path: string
}[]

export default function Page() {
    const [ListFiles, setListFiles] = useState<Files | null>()
    const [user, setUser] = useState<string | null>(null)
    const [customFileName, setCustomFileName] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [isLoading, setIsloading] = useState<boolean>(true)

    const inputUsername = useRef<HTMLInputElement>(null)
    const inputFile = useRef<HTMLInputElement>(null)
    const inputEditFileName = useRef<HTMLInputElement>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchFiles = useCallback(async () => {
        const { data, error } = await supabase
            .from('files')
            .select('*')
            .order('id', { ascending: false })

        if (error) {
            console.error(error)
            return
        }
        setListFiles(data)
        setIsloading(false)
    }, [supabase])

    //upload file
    const handleFile = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()

            if (!file) {
                alert('ได้โปรดเลือกไฟล์ด้วย ถือว่าขอร้อง')
                return
            }

            setIsloading(true)

            //edit file name
            const ext =
                file.name.split('.').pop() === 'jpeg'
                    ? 'jpg'
                    : file.name.split('.').pop()
            const beforeEditFileName = file.name.split('.')

            const finalFileName =
                customFileName.trim() !== ''
                    ? `${customFileName}.${ext?.toLowerCase()}`
                    : `${beforeEditFileName[0]}.${ext?.toLowerCase()}`

            const filePath = `uploads/${finalFileName}`

            const { error: uploadError } = await supabase.storage
                .from('files')
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false,
                })

            if (uploadError) {
                console.error(uploadError)
                alert('ชื่อไฟล์ซ้ำกันหรือป่าววว')
                setIsloading(false)
                return
            }

            const { error: insertError } = await supabase.from('files').insert({
                file_name: finalFileName,
                file_path: filePath,
                size: file.size,
                mime: file.type,
                user_name: !user ? 'Anonymous' : user,
            })

            if (insertError) {
                console.error(insertError)
                alert('เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลไฟล์')
                setIsloading(false)
                return
            }

            // reset
            setFile(null)
            setCustomFileName('')
            setUser(null)
            if (inputUsername.current) inputUsername.current.value = ''
            if (inputFile.current) inputFile.current.value = ''
            if (inputEditFileName.current) inputEditFileName.current.value = ''

            fetchFiles()
        },
        [file, user, customFileName, supabase, fetchFiles]
    )

    const downloadFile = useCallback(
        async (path: string, name: string) => {
            const { data, error } = await supabase.storage
                .from('files')
                .download(path)

            if (error || !data) return

            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = name
            // a.target = 'blank'
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        },
        [supabase]
    )

    const refresh = useCallback(() => {
        setIsloading(true)
        fetchFiles()
    }, [fetchFiles])

    const handleDelete = useCallback(
        async (id: number, path: string) => {
            setIsloading(true)

            const { error } = await supabase.from('files').delete().eq('id', id)

            const res = await supabase.storage.from('files').remove([path])

            if (error) {
                // console.log(error)
                alert('ลบไม่สำเร็จ')
            }

            if (res.error) {
                // console.log(res.error)
            }

            fetchFiles()
        },
        [supabase, fetchFiles]
    )

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    return (
        <div className="flex min-h-screen w-screen items-center justify-center bg-black p-6 text-gray-300">
            <div className="w-full max-w-lg space-y-12">
                <h1 className="select-none text-center text-3xl font-light tracking-wider">
                    <span className="text-cyan-400">Upload</span> File
                </h1>

                <div className="max-h-[40vh] select-none space-y-2">
                    <div className="flex justify-end gap-3">
                        <div className="text-sm text-sky-500">
                            refresh button
                        </div>
                        <div
                            className="w-fit cursor-pointer rounded-lg border p-0.5 transition-all ease-in hover:scale-95 hover:border-black hover:bg-white hover:text-black active:scale-75"
                            onClick={refresh}
                        >
                            <RefreshCcw size={18} />
                        </div>
                    </div>
                    <div className='max-h-[40vh] overflow-auto scll rounded-sm'>
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
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        onClick={() =>
                                            downloadFile(
                                                item.file_path,
                                                item.file_name
                                            )
                                        }
                                        className="flex w-full cursor-pointer items-center justify-between border-b border-gray-800 px-4 py-3 text-sm transition-colors duration-300 hover:border-cyan-500"
                                    >
                                        {item.file_name}
                                        <div className="text-sm font-light text-gray-400/80">
                                            {item.user_name}
                                        </div>
                                    </div>
                                    <div
                                        className="cursor-pointer rounded-lg border p-0.5 transition-all ease-in hover:scale-95 hover:border-black hover:bg-white hover:text-black active:scale-75 active:border-black active:bg-red-500 active:text-black"
                                        onClick={() =>
                                            handleDelete(
                                                item.id,
                                                item.file_path
                                            )
                                        }
                                    >
                                        <X size={18} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <form
                    onSubmit={(e) => !isLoading && handleFile(e)}
                    className="space-y-6"
                >
                    <input
                        ref={inputUsername}
                        type="text"
                        placeholder="Your name (optional)"
                        onChange={(e) =>
                            setUser(
                                e.target.value.trim() === ''
                                    ? 'Anonymous'
                                    : e.target.value
                            )
                        }
                        className="w-full border-b border-gray-700 bg-transparent px-0 py-2 text-white placeholder-gray-600 outline-none transition-colors focus:border-cyan-400"
                    />

                    <input
                        type="text"
                        disabled={file === null}
                        placeholder="Edit file name (optional)"
                        ref={inputEditFileName}
                        onChange={(e) =>
                            setCustomFileName(e.target.value.trim())
                        }
                        className={`${file === null && 'hidden'} w-full border-b border-gray-700 bg-transparent px-0 py-2 text-white placeholder-gray-600 outline-none transition-colors focus:border-cyan-400`}
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
    )
}
