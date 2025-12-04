"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"

type FileType = "DOC" | "IMAGE" | "ZIP" | "ALL" | null

type CloudinaryUploadButtonProps = {
  onUploadComplete: (url: string) => void
  fileType?: FileType
  disabled?: boolean
}

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (options: any, callback: (error: any, result: any) => void) => {
        open: () => void
        destroy: () => void
      }
    }
  }
}

export function CloudinaryUploadButton({
  onUploadComplete,
  fileType = "ALL",
  disabled = false,
}: CloudinaryUploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const widgetRef = useRef<ReturnType<typeof window.cloudinary.createUploadWidget> | null>(null)

  // Map file types to Cloudinary resource types and file formats
  const getResourceType = useCallback(() => {
    if (fileType === "IMAGE") return "image"
    if (fileType === "DOC") return "raw"
    if (fileType === "ZIP") return "raw"
    return "auto" // Auto-detect for ALL
  }, [fileType])

  const getFormats = useCallback(() => {
    if (fileType === "IMAGE") {
      return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"]
    }
    if (fileType === "DOC") {
      return ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx"]
    }
    if (fileType === "ZIP") {
      return ["zip", "rar", "7z", "tar", "gz", "bz2"]
    }
    return [] // All formats for ALL
  }, [fileType])

  useEffect(() => {
    // Load Cloudinary widget script
    if (!window.cloudinary) {
      const script = document.createElement("script")
      script.src = "https://upload-widget.cloudinary.com/global/all.js"
      script.async = true
      script.onload = () => {
        setScriptLoaded(true)
      }
      script.onerror = () => {
        console.error("Failed to load Cloudinary widget script")
      }
      document.body.appendChild(script)
    } else {
      setScriptLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!scriptLoaded || !window.cloudinary) return

    const formats = getFormats()
    const resourceType = getResourceType()

    const options = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name", // Set this in .env.local
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned", // Set this in .env.local
      sources: ["local", "camera", "url", "dropbox", "google_drive"],
      resourceType: resourceType,
      multiple: false,
      maxFileSize: 10000000, // 10MB
      clientAllowedFormats: formats.length > 0 ? formats : undefined,
      cropping: fileType === "IMAGE", // Enable cropping for images
      showAdvancedOptions: false,
      styles: {
        palette: {
          window: "#FFFFFF",
          windowBorder: "#90A0B3",
          tabIcon: "#0078FF",
          menuIcons: "#5A616A",
          textDark: "#000000",
          textLight: "#FFFFFF",
          link: "#0078FF",
          action: "#FF620C",
          inactiveTabIcon: "#0E2F5A",
          error: "#F44235",
          inProgress: "#0078FF",
          complete: "#20B832",
          sourceBg: "#E4EBF1",
        },
        fonts: {
          default: null,
          "'Poppins', sans-serif": {
            url: "https://fonts.googleapis.com/css?family=Poppins",
            active: true,
          },
        },
      },
    }

    widgetRef.current = window.cloudinary.createUploadWidget(options, (error: any, result: any) => {
      if (error) {
        console.error("Upload error:", error)
        setUploading(false)
        return
      }

      if (result && result.event === "success") {
        const url = result.info.secure_url || result.info.url
        onUploadComplete(url)
        setUploading(false)
      } else if (result && result.event === "queues-end") {
        setUploading(false)
      } else if (result && result.event === "upload-added") {
        setUploading(true)
      } else if (result && result.event === "abort") {
        setUploading(false)
      }
    })

    return () => {
      // Cleanup
      if (widgetRef.current) {
        widgetRef.current.destroy()
        widgetRef.current = null
      }
    }
  }, [scriptLoaded, fileType, getFormats, getResourceType, onUploadComplete])

  const handleClick = () => {
    if (widgetRef.current && !disabled && !uploading && scriptLoaded) {
      widgetRef.current.open()
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || uploading || !scriptLoaded}
    >
      {uploading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </>
      )}
    </Button>
  )
}

