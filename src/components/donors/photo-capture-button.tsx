"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X, Image as ImageIcon, RotateCcw, Check } from "lucide-react";

/**
 * Profile photo picker: shows a small menu (Take photo / Choose from
 * gallery). "Take photo" opens a live webcam/front-camera preview via
 * getUserMedia so laptops and phones alike can snap a photo in-page;
 * "Choose from gallery" falls back to the native file picker (which on
 * phones also offers the OS camera app).
 */
export function PhotoCaptureButton({ onFile, busy, className, iconClassName }: {
  onFile: (file: File) => void;
  busy?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" onClick={() => setMenuOpen(v => !v)} disabled={busy}
        className={className ?? "absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border shadow flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"}>
        {busy ? <Loader2 className={iconClassName ?? "w-3.5 h-3.5 animate-spin"} /> : <Camera className={iconClassName ?? "w-3.5 h-3.5"} />}
      </button>

      {menuOpen && (
        <div className="absolute z-20 top-full right-0 mt-1 bg-white border rounded-xl shadow-lg py-1 w-44 text-sm">
          <button type="button" onClick={() => { setMenuOpen(false); setWebcamOpen(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700">
            <Camera className="w-4 h-4" /> Take a photo
          </button>
          <button type="button" onClick={() => { setMenuOpen(false); fileRef.current?.click(); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700">
            <ImageIcon className="w-4 h-4" /> Choose from gallery
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} />

      {webcamOpen && (
        <WebcamCapture
          onCapture={(file) => { setWebcamOpen(false); onFile(file); }}
          onClose={() => setWebcamOpen(false)}
        />
      )}
    </>
  );
}

function WebcamCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null); // data URL preview
  const [facing, setFacing] = useState<"user" | "environment">("user");

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing }, audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError("Couldn't access the camera — check permission, or use gallery instead.");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [facing]);

  function takeShot() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setShot(canvas.toDataURL("image/jpeg", 0.92));
  }

  function confirmShot() {
    if (!shot) return;
    fetch(shot).then(r => r.blob()).then(blob => {
      onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-sm bg-black rounded-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>

        {error ? (
          <div className="aspect-square flex items-center justify-center p-6 text-center text-sm text-white">{error}</div>
        ) : shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Captured" className="w-full aspect-square object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-square object-cover [transform:scaleX(-1)]" />
        )}

        <div className="p-3 flex items-center justify-center gap-3 bg-black/80">
          {shot ? (
            <>
              <button onClick={() => setShot(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm">
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <button onClick={confirmShot}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold">
                <Check className="w-4 h-4" /> Use photo
              </button>
            </>
          ) : !error ? (
            <>
              <button onClick={() => setFacing(f => f === "user" ? "environment" : "user")}
                title="Switch camera" className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={takeShot}
                className="w-14 h-14 rounded-full bg-white ring-4 ring-white/30" aria-label="Capture" />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
