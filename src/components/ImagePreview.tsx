import { useState } from "react";
import { X } from "lucide-react";

export function ImagePreview({ url, alt = "Bild" }: { url: string; alt?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!url) return null;

  return (
    <>
      <div 
        className="relative shrink-0 overflow-hidden rounded-md border border-border cursor-zoom-in hover:opacity-80 transition-opacity bg-secondary/50"
        style={{ width: "80px", height: "60px" }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <img 
          src={url} 
          alt={alt} 
          className="w-full h-full object-cover" 
        />
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] rounded-lg overflow-hidden border border-border shadow-2xl bg-background flex flex-col">
            <div className="absolute top-2 right-2 z-10 bg-background/50 rounded-full p-1 backdrop-blur hover:bg-background/80 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </div>
            <img 
              src={url} 
              alt={alt} 
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain" 
            />
          </div>
        </div>
      )}
    </>
  );
}
