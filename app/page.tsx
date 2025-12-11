'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter()
  useEffect(() =>{
    router.push("/file")
  },[router])
  return (
    <main className="min-h-screen flex flex-col items-center">

    </main>
  );
}
