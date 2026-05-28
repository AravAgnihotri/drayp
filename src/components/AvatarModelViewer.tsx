"use client"

import { useEffect, useRef, useState } from "react"

type ModelViewerElement = HTMLElement & {
  src?: string
  alt?: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<ModelViewerElement>, ModelViewerElement> & {
        src?: string
        alt?: string
        "camera-controls"?: boolean | ""
        "auto-rotate"?: boolean | ""
        "shadow-intensity"?: string
        exposure?: string
        "interaction-prompt"?: string
      }
    }
  }
}

const SCRIPT_SRC = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"

let scriptLoadPromise: Promise<void> | null = null

function loadModelViewerScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (customElements.get("model-viewer")) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Failed to load 3D viewer.")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.type = "module"
    script.src = SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load 3D viewer."))
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

type Props = {
  src: string
  className?: string
  fallbackHref?: string | null
}

export default function AvatarModelViewer({ src, className, fallbackHref }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let viewer: ModelViewerElement | null = null

    setLoading(true)
    setError(null)

    void loadModelViewerScript()
      .then(() => {
        if (cancelled || !containerRef.current) return

        viewer = document.createElement("model-viewer") as ModelViewerElement
        viewer.setAttribute("camera-controls", "")
        viewer.setAttribute("auto-rotate", "")
        viewer.setAttribute("shadow-intensity", "1")
        viewer.setAttribute("exposure", "1")
        viewer.setAttribute("interaction-prompt", "none")
        viewer.style.width = "100%"
        viewer.style.height = "100%"
        viewer.style.minHeight = "100%"
        viewer.alt = "Your 3D body avatar"

        const onLoad = () => {
          if (!cancelled) setLoading(false)
        }
        const onErr = () => {
          if (!cancelled) {
            setLoading(false)
            setError("Could not display the 3D model in the browser.")
          }
        }

        viewer.addEventListener("load", onLoad)
        viewer.addEventListener("error", onErr)
        viewer.src = src

        containerRef.current.replaceChildren(viewer)
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false)
          setError("3D viewer failed to load.")
        }
      })

    return () => {
      cancelled = true
      viewer?.remove()
    }
  }, [src])

  return (
    <div className={`relative h-full w-full min-h-0 ${className ?? ""}`}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-xs text-gray-500">
          Loading 3D model…
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 px-3 text-center text-xs text-gray-600">
          <p>{error}</p>
          {fallbackHref ? (
            <a
              href={fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#3a70c0] underline"
            >
              Open model file
            </a>
          ) : null}
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full min-h-0" />
    </div>
  )
}
