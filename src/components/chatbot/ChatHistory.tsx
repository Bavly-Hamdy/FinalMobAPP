
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { History, Heart, Clock, Trash2, Plus, CheckSquare, Square, Save, BookOpen } from "lucide-react";
import { firebaseService, SavedMessage } from "@/services/firebaseService";

interface ChatEntry {
  id: string;
  title: string;
  timestamp: Date;
  isFavorite: boolean;
  messages: any[];
}

interface ChatHistoryProps {
  chatHistory: ChatEntry[];
  savedChats: ChatEntry[];
  onLoadChat: (chat: ChatEntry) => void;
  onDeleteChat: (chatId: string) => void;
  onToggleFavorite: (chatId: string) => void;
  onNewChat: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  chatHistory,
  savedChats,
  onLoadChat,
  onDeleteChat,
  onToggleFavorite,
  onNewChat,
}) => {
  const { language } = useAppContext();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [favoriteMessages, setFavoriteMessages] = useState<SavedMessage[]>([]);

  useEffect(() => {
    // Subscribe to saved messages
    const unsubscribeSaved = firebaseService.subscribeToSavedMessages('saved', setSavedMessages);
    
    // Subscribe to favorite messages
    const unsubscribeFavorite = firebaseService.subscribeToSavedMessages('favorite', setFavoriteMessages);

    return () => {
      unsubscribeSaved();
      unsubscribeFavorite();
    };
  }, []);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const handleSelectAll = () => {
    const allChatIds = [...chatHistory, ...savedChats].map(chat => chat.id);
    if (selectedChats.size === allChatIds.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(allChatIds));
    }
  };

  const handleDeleteSelected = () => {
    selectedChats.forEach(chatId => onDeleteChat(chatId));
    setSelectedChats(new Set());
    setSelectionMode(false);
  };

  const handleChatSelect = (chatId: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const handleRemoveSavedMessage = async (savedMessageId: string) => {
    try {
      await firebaseService.removeSavedMessage(savedMessageId);
    } catch (error) {
      console.error('Error removing saved message:', error);
    }
  };

  const renderSavedMessage = (message: SavedMessage) => (
    <Card key={message.id} className="p-3 mb-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-sm mb-1 line-clamp-2">
            {message.content.substring(0, 100)}...
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{formatTimestamp(message.timestamp)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleRemoveSavedMessage(message.id)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </Card>
  );

  const renderChatEntry = (chat: ChatEntry) => (
    <Card key={chat.id} className="p-3 mb-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2">
        {selectionMode && (
          <Checkbox
            checked={selectedChats.has(chat.id)}
            onCheckedChange={() => handleChatSelect(chat.id)}
            className="mt-1"
          />
        )}
        <div 
          className="flex-1 cursor-pointer" 
          onClick={() => !selectionMode && onLoadChat(chat)}
        >
          <h4 className="text-sm font-medium mb-1 line-clamp-2">{chat.title}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{formatTimestamp(chat.timestamp)}</span>
          </div>
        </div>
        {!selectionMode && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(chat.id);
              }}
            >
              <Heart size={12} className={chat.isFavorite ? "fill-red-500 text-red-500" : ""} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History size={20} />
          {language === 'ar' ? 'سجل المحادثات' : 'Chat History'}
        </h2>
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 space-y-2 border-b">
        <Button onClick={onNewChat} className="w-full gap-2" variant="default">
          <Plus size={16} />
          {language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelectedChats(new Set());
            }}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Trash2 size={16} />
            {selectionMode 
              ? (language === 'ar' ? 'إلغاء' : 'Cancel')
              : (language === 'ar' ? 'تنظيف المحادثات' : 'Clean Chats')
            }
          </Button>
          
          {selectionMode && (
            <>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="icon"
                title={language === 'ar' ? 'تحديد الكل' : 'Select All'}
              >
                {selectedChats.size === [...chatHistory, ...savedChats].length ? 
                  <CheckSquare size={16} /> : <Square size={16} />
                }
              </Button>
              <Button
                onClick={handleDeleteSelected}
                variant="destructive"
                size="icon"
                disabled={selectedChats.size === 0}
                title={language === 'ar' ? 'حذف المحدد' : 'Delete Selected'}
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Saved Messages */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Save size={16} />
              {language === 'ar' ? 'الرسائل المحفوظة' : 'Saved Messages'}
            </h3>
            {savedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'لا توجد رسائل محفوظة' : 'No saved messages'}
              </p>
            ) : (
              savedMessages.map(renderSavedMessage)
            )}
          </div>

          <Separator />

          {/* Favorite Messages */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Heart size={16} />
              {language === 'ar' ? 'الرسائل المفضلة' : 'Favorite Messages'}
            </h3>
            {favoriteMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'لا توجد رسائل مفضلة' : 'No favorite messages'}
              </p>
            ) : (
              favoriteMessages.map(renderSavedMessage)
            )}
          </div>

          <Separator />

          {/* Saved & Favorite Chats */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BookOpen size={16} />
              {language === 'ar' ? 'المحادثات المحفوظة والمفضلة' : 'Saved & Favorite Chats'}
            </h3>
            {savedChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'لا توجد محادثات محفوظة' : 'No saved chats'}
              </p>
            ) : (
              savedChats.map(renderChatEntry)
            )}
          </div>

          <Separator />

          {/* Recent Chat History */}
          <div>
            <h3 className="text-sm font-medium mb-3">
              {language === 'ar' ? 'المحادثات الأخيرة' : 'Recent Chats'}
            </h3>
            {chatHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'لا توجد محادثات' : 'No chat history'}
              </p>
            ) : (
              chatHistory.map(renderChatEntry)
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;
