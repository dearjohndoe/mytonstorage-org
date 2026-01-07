"use client"

import { useAppStore } from "@/store/useAppStore"
import { useEffect, useState } from "react";
import { PageContent } from "@/components/page-content";

export default function Bags() {
  const { setCurrentPage } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCurrentPage(2)
    setMounted(true)
  }, [setCurrentPage])

  if (!mounted) {
    return (
      <></>
    )
  }

  return <PageContent />
}
