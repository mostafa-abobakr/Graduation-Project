import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export function InvoiceUploader({ onFileSelected, onReset }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // Drag-to-pan state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setZoom(1);
      e.target.value = null;
      onFileSelected(selectedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setZoom(1);
    onReset();
  };

  const isZoomed = zoom > 1.01;

  const handleMouseDown = (e) => {
    if (!scrollRef.current || !isZoomed) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollPos({
      left: scrollRef.current.scrollLeft,
      top: scrollRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current || !isZoomed) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    scrollRef.current.scrollLeft = scrollPos.left - dx;
    scrollRef.current.scrollTop = scrollPos.top - dy;
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleClick = () => {
    if (!file?.type?.includes("pdf")) {
      setZoom((z) => (z <= 1.05 ? 1.75 : 1));
    }
  };

  return (
    <div className="lg:w-1/3 min-h-[400px] lg:h-auto shrink-0 border border-border/60 rounded-xl bg-muted/10 flex flex-col relative overflow-hidden premium-shadow">
      {!previewUrl ? (
        <div
          className="flex-1 flex flex-col items-center justify-center p-10 text-center hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={triggerFileInput}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,image/*"
            onChange={handleFileChange}
          />
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-xl text-foreground">
            Upload Invoice Document
          </h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Click to browse or drag and drop your PDF or image here. Our AI will
            automatically extract items.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full relative">
          <div className="absolute top-2 right-2 z-20 flex gap-2">
            {!file?.type?.includes("pdf") && (
              <div className="flex items-center bg-background/90 backdrop-blur-sm border border-border rounded-md shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-mono w-12 text-center">
                  {Math.round((zoom - 1) * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-2 shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start Over
            </Button>
          </div>
          <div
            ref={scrollRef}
            className={`flex-1 bg-white relative rounded-b-xl overflow-auto select-none ${isZoomed && isDragging ? "cursor-grabbing" : isZoomed ? "cursor-grab" : "cursor-default"}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            {file?.type?.includes("pdf") ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="absolute inset-0 w-full h-full"
              >
                <p className="p-4 text-center">
                  PDF preview not available. Please view the document
                  externally.
                </p>
              </object>
            ) : (
              <div
                className="flex items-center justify-center transition-all duration-75"
                style={{
                  width: `calc(100% * ${zoom})`,
                  height: `calc(100% * ${zoom})`,
                  minWidth: "100%",
                  minHeight: "100%",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Invoice Preview"
                  draggable={false}
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
