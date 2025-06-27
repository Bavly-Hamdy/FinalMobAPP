import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Send, Volume2, Bot, User, Search, Brain, Mic, Save, Heart, Share2, Menu, Paperclip, MicOff, AlertCircle, Languages } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { askGemini } from "@/api/geminiClient";
import ChatHistory from "@/components/chatbot/ChatHistory";
import ShareChat from "@/components/chatbot/ShareChat";
import FileAttachment from "@/components/chatbot/FileAttachment";
import { firebaseService } from "@/services/firebaseService";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  isTyping?: boolean;
  isSaved?: boolean;
  isFavorite?: boolean;
  attachments?: AttachedFile[];
}

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface ChatEntry {
  id: string;
  title: string;
  timestamp: Date;
  isFavorite: boolean;
  messages: Message[];
}

const Chatbot = () => {
  const { t, language } = useAppContext();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [asrLanguage, setAsrLanguage] = useState<'en' | 'ar'>('en'); // New ASR language state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: language === 'ar' 
        ? "# مرحباً بك في VitalSync Health Hub\n\n## مساعدك الذكي للصحة\n\nأهلاً وسهلاً! أنا مساعدك الصحي المدعوم بتقنية Gemini AI.\n\n### كيف يمكنني مساعدتك اليوم؟\n- استشارات صحية عامة\n- تحليل القراءات الطبية\n- نصائح للعناية بالصحة\n- إرشادات طبية موثوقة"
        : "# Welcome to VitalSync Health Hub\n\n## Your Intelligent Health Assistant\n\nHello! I'm your health assistant powered by Gemini AI.\n\n### How can I help you today?\n- General health consultations\n- Medical readings analysis\n- Health care tips\n- Reliable medical guidance",
      timestamp: new Date(),
    },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [deepThinking, setDeepThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedChatForShare, setSelectedChatForShare] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [savedChats, setSavedChats] = useState<ChatEntry[]>([]);
  const [currentChatId] = useState(`chat-${Date.now()}`);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [favoriteMessageIds, setFavoriteMessageIds] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition Hook with explicit language selection
  const speechRecognition = useSpeechRecognition({
    language: asrLanguage, // Use explicit ASR language selection
    onTranscriptChange: (transcript) => {
      setMessage(transcript);
    },
    onFinalTranscript: (transcript) => {
      setMessage(transcript);
    }
  });

  // Load saved and favorite message IDs from Firebase on mount
  useEffect(() => {
    const loadSavedFavoriteStatus = async () => {
      try {
        // Subscribe to saved messages to get their IDs
        const unsubscribeSaved = firebaseService.subscribeToSavedMessages('saved', (savedMessages) => {
          const savedIds = new Set(savedMessages.map(msg => msg.messageId));
          setSavedMessageIds(savedIds);
          
          // Update message state to reflect saved status
          setMessages(prevMessages => 
            prevMessages.map(msg => ({
              ...msg,
              isSaved: savedIds.has(msg.id)
            }))
          );
        });

        // Subscribe to favorite messages to get their IDs
        const unsubscribeFavorite = firebaseService.subscribeToSavedMessages('favorite', (favoriteMessages) => {
          const favoriteIds = new Set(favoriteMessages.map(msg => msg.messageId));
          setFavoriteMessageIds(favoriteIds);
          
          // Update message state to reflect favorite status
          setMessages(prevMessages => 
            prevMessages.map(msg => ({
              ...msg,
              isFavorite: favoriteIds.has(msg.id)
            }))
          );
        });

        // Clean up subscriptions on unmount
        return () => {
          unsubscribeSaved();
          unsubscribeFavorite();
        };
      } catch (error) {
        console.error('Error loading saved/favorite status:', error);
      }
    };

    loadSavedFavoriteStatus();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Detect language and dialect
  const detectLanguage = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    const egyptianColloquialWords = /\b(إزيك|إيه|ازيك|كدا|كده|بقى|علشان|عشان|اهو|اهي|يلا|ماشي|طب|هو|هي)\b/i;
    
    if (arabicRegex.test(text)) {
      if (egyptianColloquialWords.test(text)) {
        return 'egyptian';
      }
      return 'arabic';
    }
    return 'english';
  };

  const addTypingMessage = (): string => {
    const typingId = `typing-${Date.now()}`;
    const typingMessage: Message = {
      id: typingId,
      role: "bot",
      content: language === 'ar' ? "جاري الكتابة..." : "Typing...",
      timestamp: new Date(),
      isTyping: true,
    };
    
    setMessages((prev) => [...prev, typingMessage]);
    return typingId;
  };

  const addThinkingMessage = (): string => {
    const thinkingId = `thinking-${Date.now()}`;
    const thinkingContent = language === 'ar' 
      ? (deepThinking ? "## 🧠 التفكير العميق\n### جاري تحليل استفسارك بعناية..." : "## 💭 جاري التفكير\n### معالجة طلبك...")
      : (deepThinking ? "## 🧠 Deep Thinking\n### Analyzing your query carefully..." : "## 💭 Thinking\n### Processing your request...");
    
    const thinkingMessage: Message = {
      id: thinkingId,
      role: "bot",
      content: thinkingContent,
      timestamp: new Date(),
      isThinking: true,
    };
    
    setMessages((prev) => [...prev, thinkingMessage]);
    return thinkingId;
  };

  const removeMessage = (messageId: string) => {
    setMessages((prev) => prev.filter(msg => msg.id !== messageId));
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage = message.trim();
    const detectedLanguage = detectLanguage(userMessage);
    
    // Clear input immediately and stop listening
    setMessage("");
    setIsLoading(true);

    if (speechRecognition.isListening) {
      speechRecognition.stopListening();
    }

    // Get user's first name for dynamic heading
    const userFirstName = profile?.firstName || (language === 'ar' ? 'المستخدم' : 'User');
    const headerText = `### ${userFirstName}`;
    
    // Create content with attachments
    let content = `${headerText}\n${userMessage}`;
    if (attachedFiles.length > 0) {
      const attachmentText = language === 'ar' ? '\n\n**الملفات المرفقة:**\n' : '\n\n**Attached Files:**\n';
      content += attachmentText + attachedFiles.map(file => `- ${file.name}`).join('\n');
    }
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content,
      timestamp: new Date(),
      attachments: [...attachedFiles],
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setAttachedFiles([]); // Clear attachments after sending

    // Add typing indicator first
    const typingId = addTypingMessage();
    
    // Short delay to show typing
    setTimeout(() => {
      removeMessage(typingId);
      
      // Add thinking placeholder if deep thinking is enabled
      const thinkingId = deepThinking ? addThinkingMessage() : null;
      
      // Call Gemini API
      handleGeminiCall(userMessage, detectedLanguage, thinkingId);
    }, 1000);
  };

  const handleGeminiCall = async (userMessage: string, detectedLanguage: string, thinkingId: string | null) => {
    try {
      // Enhanced prompt based on detected language (not UI language)
      let enhancedPrompt = userMessage;
      
      if (detectedLanguage === 'arabic') {
        enhancedPrompt = `أجب بالعربية الفصحى فقط واستخدم تنسيق Markdown مع العناوين والتنظيم المناسب. استخدم **النص** للنص العريض وليس ****النص****. لا تخلط اللغات في الرد. السؤال: ${userMessage}`;
      } else if (detectedLanguage === 'egyptian') {
        enhancedPrompt = `أجب بالعامية المصرية فقط واستخدم تنسيق Markdown مع العناوين والتنظيم المناسب. استخدم **النص** للنص العريض وليس ****النص****. لا تخلط اللغات في الرد. السؤال: ${userMessage}`;
      } else {
        enhancedPrompt = `Reply in English only using proper Markdown formatting with headings and organization. Use **text** for bold text, not ****text****. Do not mix languages in your response. Question: ${userMessage}`;
      }

      const botResponse = await askGemini(enhancedPrompt, deepThinking);
      
      // Remove thinking message if it exists
      if (thinkingId) {
        removeMessage(thinkingId);
      }
      
      // Add formatted bot response
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: botResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      
      // Remove thinking message if it exists
      if (thinkingId) {
        removeMessage(thinkingId);
      }
      
      // Show error message based on UI language - using proper **bold** syntax
      const errorContent = language === 'ar' 
        ? "## ⚠️ خطأ في الاتصال\n### عذراً، حدث خطأ أثناء الاتصال بـ Gemini.\n**الرجاء المحاولة لاحقاً.**"
        : "## ⚠️ Connection Error\n### Sorry, an error occurred while connecting to Gemini.\n**Please try again later.**";
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: errorContent,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: language === 'ar' ? "خطأ في الاتصال" : "Connection Error",
        description: language === 'ar' 
          ? "فشل الاتصال بـ Gemini AI. الرجاء المحاولة مرة أخرى."
          : "Failed to connect to Gemini AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced save message with Firebase persistence and retry logic
  const handleSaveMessage = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    const isCurrentlySaved = savedMessageIds.has(messageId);

    if (isCurrentlySaved) {
      toast({
        title: language === 'ar' ? "محفوظ مسبقاً" : "Already Saved",
        description: language === 'ar' ? "هذه الرسالة محفوظة بالفعل" : "This message is already saved",
      });
      return;
    }

    let retryCount = 0;
    const maxRetries = 2;

    const attemptSave = async (): Promise<void> => {
      try {
        await firebaseService.saveMessage(
          messageId,
          currentChatId,
          message.content,
          message.timestamp,
          'saved'
        );

        // Update local state
        setSavedMessageIds(prev => new Set([...prev, messageId]));
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isSaved: true } : msg
        ));

        toast({
          title: language === 'ar' ? "تم الحفظ ✅" : "Saved ✅",
          description: language === 'ar' ? "تم حفظ الرسالة بنجاح" : "Message saved successfully",
        });
      } catch (error) {
        console.error('Error saving message:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying save operation, attempt ${retryCount}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          await attemptSave();
        } else {
          toast({
            title: language === 'ar' ? "فشل الحفظ" : "Save Failed",
            description: language === 'ar' 
              ? "غير قادر على الحفظ—يرجى المحاولة مرة أخرى"
              : "Unable to save—please retry",
            variant: "destructive",
          });
        }
      }
    };

    await attemptSave();
  };

  // Enhanced favorite message with Firebase persistence and retry logic
  const handleFavoriteMessage = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    const isCurrentlyFavorite = favoriteMessageIds.has(messageId);

    if (isCurrentlyFavorite) {
      toast({
        title: language === 'ar' ? "مفضل مسبقاً" : "Already Favorited",
        description: language === 'ar' ? "هذه الرسالة مفضلة بالفعل" : "This message is already favorited",
      });
      return;
    }

    let retryCount = 0;
    const maxRetries = 2;

    const attemptFavorite = async (): Promise<void> => {
      try {
        await firebaseService.saveMessage(
          messageId,
          currentChatId,
          message.content,
          message.timestamp,
          'favorite'
        );

        // Update local state
        setFavoriteMessageIds(prev => new Set([...prev, messageId]));
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isFavorite: true } : msg
        ));

        toast({
          title: language === 'ar' ? "تمت الإضافة للمفضلة ⭐️" : "Favorited ⭐️",
          description: language === 'ar' ? "تمت إضافة الرسالة للمفضلة بنجاح" : "Message added to favorites successfully",
        });
      } catch (error) {
        console.error('Error favoriting message:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying favorite operation, attempt ${retryCount}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          await attemptFavorite();
        } else {
          toast({
            title: language === 'ar' ? "فشل التفضيل" : "Favorite Failed",
            description: language === 'ar' 
              ? "غير قادر على الحفظ—يرجى المحاولة مرة أخرى"
              : "Unable to save—please retry",
            variant: "destructive",
          });
        }
      }
    };

    await attemptFavorite();
  };

  const handleShareMessage = (messageId: string) => {
    setSelectedChatForShare(messageId);
    setShareDialogOpen(true);
  };

  const handleFileAttach = (file: AttachedFile) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleFileRemove = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const saveCurrentChat = () => {
    if (messages.length <= 1) return;
    
    const chatTitle = messages[1]?.content?.split('\n')[1]?.substring(0, 50) + '...' || 
                     (language === 'ar' ? 'محادثة صحية' : 'Health Chat');
    
    const newChat: ChatEntry = {
      id: Date.now().toString(),
      title: chatTitle,
      timestamp: new Date(),
      isFavorite: false,
      messages: [...messages],
    };
    
    setChatHistory(prev => [newChat, ...prev.slice(0, 19)]); // Keep last 20 chats
    
    toast({
      title: language === 'ar' ? "تم حفظ المحادثة" : "Chat Saved",
      description: language === 'ar' ? "تم حفظ المحادثة الحالية" : "Current chat saved",
    });
  };

  const startNewChat = () => {
    setMessages([messages[0]]); // Keep only the welcome message
    setAttachedFiles([]);
    setMessage("");
    toast({
      title: language === 'ar' ? "محادثة جديدة" : "New Chat",
      description: language === 'ar' ? "تم بدء محادثة جديدة" : "Started a new chat",
    });
  };

  const loadChat = (chat: ChatEntry) => {
    setMessages(chat.messages);
    toast({
      title: language === 'ar' ? "تم تحميل المحادثة" : "Chat Loaded",
      description: language === 'ar' ? "تم تحميل المحادثة بنجاح" : "Chat loaded successfully",
    });
  };

  const deleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const toggleChatFavorite = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId) || savedChats.find(c => c.id === chatId);
    if (!chat) return;
    
    if (chat.isFavorite) {
      setSavedChats(prev => prev.filter(c => c.id !== chatId));
    } else {
      setSavedChats(prev => [...prev, { ...chat, isFavorite: true }]);
    }
    
    setChatHistory(prev => prev.map(c => 
      c.id === chatId ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  // Split text by language for proper TTS handling
  const splitByLanguage = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    const segments = [];
    let currentSegment = "";
    let isArabic = null;

    for (const char of text) {
      const charIsArabic = arabicRegex.test(char);
      
      if (isArabic === null) {
        isArabic = charIsArabic;
        currentSegment += char;
      } else if (isArabic === charIsArabic) {
        currentSegment += char;
      } else {
        if (currentSegment.trim()) {
          segments.push({ text: currentSegment.trim(), isArabic });
        }
        currentSegment = char;
        isArabic = charIsArabic;
      }
    }

    if (currentSegment.trim()) {
      segments.push({ text: currentSegment.trim(), isArabic });
    }

    return segments;
  };

  // Enhanced Text-to-Speech with better Arabic support and hash removal
  const cleanTextForTTS = (text: string) => {
    // Remove markdown formatting and hash symbols
    return text
      .replace(/#{1,6}\s*/g, '') // Remove # headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove *italic* formatting
      .replace(/\n{2,}/g, '. ') // Replace multiple newlines with periods
      .replace(/\n/g, ' ') // Replace single newlines with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      // Clean text for better TTS
      const cleanedText = cleanTextForTTS(text);
      
      if (!cleanedText.trim()) return;
      
      // Split text by language for proper pronunciation
      const segments = splitByLanguage(cleanedText);
      
      segments.forEach((segment, index) => {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        
        // Enhanced voice settings for better quality
        if (segment.isArabic) {
          utterance.lang = 'ar-SA';
          utterance.rate = 0.85; // Slightly slower for Arabic
          utterance.pitch = 1.1; // Higher pitch for better clarity
          utterance.volume = 0.9;
        } else {
          utterance.lang = 'en-US';
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 0.9;
        }
        
        // Add natural pauses between segments
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, index * 200);
      });
      
      toast({
        title: language === 'ar' ? 'تشغيل الصوت' : 'Playing Audio',
        description: language === 'ar' ? 'جاري قراءة النص' : 'Reading text aloud',
      });
    } else {
      toast({
        title: language === 'ar' ? "غير مدعوم" : "Not Supported",
        description: language === 'ar' 
          ? "تحويل النص إلى كلام غير مدعوم في هذا المتصفح."
          : "Text-to-speech is not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  const handleVoiceAssistant = () => {
    if (!speechRecognition.isSupported) {
      toast({
        title: language === 'ar' ? "غير مدعوم" : "Not Supported",
        description: language === 'ar' 
          ? "التعرف على الصوت غير مدعوم في هذا المتصفح."
          : "Speech recognition is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    if (speechRecognition.isListening) {
      speechRecognition.stopListening();
    } else {
      speechRecognition.startListening();
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Filter messages that contain the search query
    const filteredMessages = messages.filter(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) && !msg.isThinking
    );
    
    if (filteredMessages.length === 0) {
      toast({
        title: language === 'ar' ? "لا توجد نتائج" : "No Results",
        description: language === 'ar'
          ? `لم يتم العثور على رسائل تحتوي على "${searchQuery}".`
          : `No messages found containing "${searchQuery}".`,
      });
    } else {
      toast({
        title: language === 'ar' ? "نتائج البحث" : "Search Results",
        description: language === 'ar'
          ? `تم العثور على ${filteredMessages.length} رسالة تحتوي على "${searchQuery}".`
          : `Found ${filteredMessages.length} message(s) containing "${searchQuery}".`,
      });
    }
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setSearchQuery("");
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    }).format(date);
  };

  const renderMessageContent = (content: string) => {
    // Basic Markdown rendering for headers - ensuring no **** syntax is displayed
    const lines = content.split('\n');
    const renderedLines = lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-xl font-bold mb-2 text-primary">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-semibold mb-2 text-primary">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-base font-medium mb-1 text-muted-foreground">{line.substring(4)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>;
      } else if (line.includes('**') && !line.includes('****')) {
        // Handle **bold** text properly without showing asterisks
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={index} className="mb-1">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        );
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-1">{line}</p>;
      }
    });
    
    return <div className="space-y-1">{renderedLines}</div>;
  };

  return (
    <MainLayout>
      <div className="container p-4 md:p-6 max-w-md mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('chatbot')}</h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'مدعوم بتقنية Gemini AI' : 'Powered by Gemini AI'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSearch}>
              <Search size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={saveCurrentChat}>
              <Save size={20} />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <ChatHistory
                  chatHistory={chatHistory}
                  savedChats={savedChats}
                  onLoadChat={loadChat}
                  onDeleteChat={deleteChat}
                  onToggleFavorite={toggleChatFavorite}
                  onNewChat={startNewChat}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isSearchVisible && (
          <div className="mb-4 flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'البحث في المحادثة...' : 'Search conversation...'}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} size="sm">
              {language === 'ar' ? 'بحث' : 'Search'}
            </Button>
          </div>
        )}

        {/* Language Toggle for ASR */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <Languages size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {language === 'ar' ? 'لغة التعرف على الصوت:' : 'Speech Recognition:'}
            </span>
            <ToggleGroup
              type="single"
              value={asrLanguage}
              onValueChange={(value) => {
                if (value) {
                  setAsrLanguage(value as 'en' | 'ar');
                  // Stop current recognition if active
                  if (speechRecognition.isListening) {
                    speechRecognition.stopListening();
                  }
                }
              }}
              className="bg-background rounded-md"
            >
              <ToggleGroupItem 
                value="en" 
                className="text-xs px-3 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                EN
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="ar" 
                className="text-xs px-3 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                العربية
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Expanded Chat Window */}
        <Card className="flex flex-col h-[calc(100vh-240px)]">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">
              {language === 'ar' ? 'نافذة المحادثة' : 'Chat Window'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {asrLanguage === 'ar' 
                ? 'التعرف على الصوت: العربية' 
                : 'Speech Recognition: English'
              }
            </p>
          </div>
          
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </Avatar>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : msg.isThinking || msg.isTyping
                          ? "bg-muted/50 animate-pulse border-l-4 border-primary"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm">
                        {renderMessageContent(msg.content)}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((file) => (
                              <div key={file.id} className="text-xs bg-background/50 p-2 rounded">
                                📎 {file.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <span className="text-xs opacity-70">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        {msg.role === "bot" && !msg.isThinking && !msg.isTyping && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleTextToSpeech(msg.content)}
                            >
                              <Volume2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleSaveMessage(msg.id)}
                            >
                              <Save size={14} className={msg.isSaved ? "fill-primary" : ""} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleFavoriteMessage(msg.id)}
                            >
                              <Heart size={14} className={msg.isFavorite ? "fill-red-500 text-red-500" : ""} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleShareMessage(msg.id)}
                            >
                              <Share2 size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Compact Input Controls */}
          <div className="p-3 border-t">
            {/* File Attachments Display */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 space-y-1">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs"
                  >
                    <Paperclip size={12} />
                    <span className="flex-1 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => handleFileRemove(file.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Enhanced Voice Recognition Error Display */}
            {speechRecognition.error && (
              <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle size={14} className="text-destructive flex-shrink-0" />
                <span className="flex-1 text-destructive">{speechRecognition.error}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={speechRecognition.retryListening}
                  className="h-6 text-xs px-2"
                >
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            )}
            
            {/* Compact Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1"
            >
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    speechRecognition.isListening 
                      ? (asrLanguage === 'ar' 
                          ? 'جاري الاستماع للعربية... تحدث الآن'
                          : 'Listening for English... speak now'
                        )
                      : (asrLanguage === 'ar' 
                          ? 'اكتب رسالتك أو استخدم الميكروفون للعربية...'
                          : 'Type your message or use microphone for English...'
                        )
                  }
                  className="pl-20 pr-16 h-10"
                  disabled={isLoading}
                />
                
                {/* Left Side Controls */}
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <FileAttachment
                    attachedFiles={attachedFiles}
                    onFileAttach={handleFileAttach}
                    onFileRemove={handleFileRemove}
                    compact={true}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={`h-6 w-6 ${deepThinking ? 'bg-primary/10 text-primary' : ''}`}
                    onClick={() => setDeepThinking(!deepThinking)}
                    disabled={isLoading}
                    title={language === 'ar' ? 'وضع التفكير العميق' : 'Deep Thinking Mode'}
                  >
                    <Brain size={14} />
                  </Button>
                </div>
                
                {/* Enhanced Right Side Controls with Language-Aware Mic Button */}
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={`h-6 w-6 transition-all duration-300 ${
                      speechRecognition.isListening 
                        ? 'bg-red-500/20 text-red-600 scale-110 animate-pulse' 
                        : speechRecognition.error
                        ? 'bg-destructive/10 text-destructive'
                        : 'hover:bg-primary/10'
                    }`}
                    disabled={isLoading}
                    onClick={handleVoiceAssistant}
                    title={
                      speechRecognition.isListening
                        ? (language === 'ar' ? 'إيقاف الاستماع' : 'Stop listening')
                        : (asrLanguage === 'ar' 
                            ? 'مساعد صوتي للعربية'
                            : 'Voice Assistant for English'
                          )
                    }
                  >
                    {speechRecognition.isListening ? (
                      <div className="relative">
                        <Mic size={14} />
                        <div className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping" />
                        <div className="absolute -inset-0.5 rounded-full bg-red-500/20 animate-pulse" />
                      </div>
                    ) : speechRecognition.error ? (
                      <MicOff size={14} />
                    ) : (
                      <Mic size={14} />
                    )}
                  </Button>
                  <Button 
                    type="submit" 
                    size="icon" 
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={isLoading || (!message.trim() && attachedFiles.length === 0)}
                  >
                    <Send size={14} />
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Enhanced Live Transcription Status with Language Display */}
            {speechRecognition.isListening && (
              <div className="mt-2 text-xs text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="animate-pulse">
                    {asrLanguage === 'ar' 
                      ? 'جاري الاستماع للعربية الفصحى والعامية...'
                      : 'Listening for English (verbatim capture)...'
                    }
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150" />
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-md">
            <ShareChat
              chatId={selectedChatForShare}
              chatTitle={language === 'ar' ? 'محادثة صحية' : 'Health Chat'}
              onClose={() => setShareDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Chatbot;
