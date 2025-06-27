
import React from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, MessageCircle } from "lucide-react";

interface ShareChatProps {
  chatId: string;
  chatTitle: string;
  onClose: () => void;
}

const ShareChat: React.FC<ShareChatProps> = ({ chatId, chatTitle, onClose }) => {
  const { language } = useAppContext();
  const { toast } = useToast();

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-chat/${chatId}`;
  };

  const handleCopyLink = async () => {
    const link = generateShareLink();
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: language === 'ar' ? "تم النسخ" : "Copied",
        description: language === 'ar' ? "تم نسخ الرابط إلى الحافظة" : "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل في نسخ الرابط" : "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    const link = generateShareLink();
    const message = language === 'ar' 
      ? `شاهد محادثتي الصحية: ${chatTitle}\n${link}`
      : `Check out my health chat: ${chatTitle}\n${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const link = generateShareLink();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(facebookUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Share2 size={32} className="mx-auto mb-2 text-primary" />
        <h3 className="text-lg font-semibold">
          {language === 'ar' ? 'مشاركة المحادثة' : 'Share Chat'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {language === 'ar' ? 'اختر طريقة المشاركة' : 'Choose how to share'}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Copy size={16} />
          {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
        </Button>

        <Button
          onClick={handleWhatsAppShare}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <MessageCircle size={16} />
          {language === 'ar' ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
        </Button>

        <Button
          onClick={handleFacebookShare}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Share2 size={16} />
          {language === 'ar' ? 'مشاركة عبر فيسبوك' : 'Share via Facebook'}
        </Button>
      </div>

      <Button onClick={onClose} variant="secondary" className="w-full">
        {language === 'ar' ? 'إغلاق' : 'Close'}
      </Button>
    </div>
  );
};

export default ShareChat;
