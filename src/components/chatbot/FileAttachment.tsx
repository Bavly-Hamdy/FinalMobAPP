
import React, { useRef } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, Image, FileText, X } from "lucide-react";

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface FileAttachmentProps {
  attachedFiles: AttachedFile[];
  onFileAttach: (file: AttachedFile) => void;
  onFileRemove: (fileId: string) => void;
  compact?: boolean;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({
  attachedFiles,
  onFileAttach,
  onFileRemove,
  compact = false,
}) => {
  const { language } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: language === 'ar' ? "حجم الملف كبير" : "File too large",
          description: language === 'ar' ? "حجم الملف يجب أن يكون أقل من 10 ميجابايت" : "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/', 'application/pdf', 'text/', '.doc', '.docx'];
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type) || file.name.includes(type));
      
      if (!isAllowed) {
        toast({
          title: language === 'ar' ? "نوع ملف غير مدعوم" : "Unsupported file type",
          description: language === 'ar' ? "يرجى اختيار صورة أو مستند PDF أو نص" : "Please select an image, PDF, or text document",
          variant: "destructive",
        });
        return;
      }

      // Create file URL for preview
      const fileUrl = URL.createObjectURL(file);
      
      const attachedFile: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
      };

      onFileAttach(attachedFile);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} />;
    return <FileText size={16} />;
  };

  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleFileSelect}
          title={language === 'ar' ? 'إرفاق ملف' : 'Attach File'}
        >
          <Paperclip size={14} />
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        className="gap-2"
      >
        <Paperclip size={16} />
        {language === 'ar' ? 'إرفاق ملف' : 'Attach File'}
      </Button>

      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onFileRemove(file.id)}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileAttachment;
