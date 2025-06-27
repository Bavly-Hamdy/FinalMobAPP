
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSpeechRecognitionProps {
  language: 'en' | 'ar'; // Explicit language selection
  onTranscriptChange: (transcript: string) => void;
  onFinalTranscript: (transcript: string) => void;
}

export const useSpeechRecognition = ({ 
  language, 
  onTranscriptChange, 
  onFinalTranscript 
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 1;
  const finalTranscriptRef = useRef('');

  // Language-specific ASR configuration
  const getLanguageConfig = useCallback((lang: 'en' | 'ar') => {
    if (lang === 'ar') {
      return {
        code: 'ar-SA', // Modern Standard Arabic
        fallbacks: ['ar-EG', 'ar'], // Egyptian Arabic fallback
        name: 'Arabic'
      };
    } else {
      return {
        code: 'en-US',
        fallbacks: ['en-GB', 'en'],
        name: 'English'
      };
    }
  }, []);

  // Advanced deduplication - preserves complete phrases exactly as spoken
  const deduplicateTranscript = useCallback((rawTranscript: string): string => {
    if (!rawTranscript.trim()) return '';
    
    console.log('Starting verbatim processing for:', rawTranscript);
    
    // Step 1: Basic cleanup only - preserve ALL words exactly as spoken
    let cleaned = rawTranscript
      .trim()
      .replace(/\s+/g, ' '); // Normalize multiple spaces to single space only
    
    // Step 2: Remove only true duplicates (consecutive identical phrases)
    // This preserves natural repetition but removes ASR artifacts
    const words = cleaned.split(' ');
    const deduplicated: string[] = [];
    let i = 0;
    
    while (i < words.length) {
      const currentWord = words[i];
      deduplicated.push(currentWord);
      
      // Look ahead to skip only consecutive identical words (ASR artifacts)
      let j = i + 1;
      while (j < words.length && words[j] === currentWord && j - i < 3) {
        console.log(`Removing duplicate word: "${currentWord}" at position ${j}`);
        j++;
      }
      i = j;
    }
    
    const result = deduplicated.join(' ');
    
    console.log('Verbatim transcription processing:');
    console.log('Raw input:', rawTranscript);
    console.log('Final result:', result);
    console.log('Word count preserved:', result.split(' ').length);
    
    return result;
  }, []);

  // Initialize recognition with verbatim final-results-only approach
  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    const langConfig = getLanguageConfig(language);
    
    // Verbatim transcription settings
    recognition.continuous = false; // Single utterance for precision
    recognition.interimResults = false; // Final results only - no interim duplicates
    recognition.lang = langConfig.code;
    recognition.maxAlternatives = 1;

    // Reset tracking on initialization
    finalTranscriptRef.current = '';

    recognition.onstart = () => {
      console.log(`Speech recognition started for ${langConfig.name} (${langConfig.code})`);
      console.log('Verbatim capture mode: final results only');
      setIsListening(true);
      setError(null);
      retryCountRef.current = 0;
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event) => {
      console.log('Speech recognition result event (final only):', event);
      
      // Process only the final result - ensure verbatim capture
      if (event.results.length > 0) {
        const lastResult = event.results[event.results.length - 1];
        
        if (lastResult.isFinal) {
          const rawTranscript = lastResult[0].transcript;
          console.log(`Final verbatim result: "${rawTranscript}"`);
          
          // Apply minimal cleaning while preserving exact speech
          const cleanedTranscript = deduplicateTranscript(rawTranscript);
          
          if (cleanedTranscript) {
            // Store the exact final transcript as spoken
            finalTranscriptRef.current = cleanedTranscript;
            console.log('Verbatim transcript captured:', cleanedTranscript);
            
            // Emit for real-time display
            onTranscriptChange(cleanedTranscript);
          }
        }
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      if (finalTranscriptRef.current.trim()) {
        let finalText = finalTranscriptRef.current.trim();
        
        // Add appropriate punctuation only if missing - preserve all words
        if (!/[.!?؟]$/.test(finalText)) {
          const isArabic = language === 'ar';
          finalText += isArabic ? '.' : '.';
        }
        
        console.log('Complete verbatim transcript for submission:', finalText);
        console.log('Exact word count preserved:', finalText.replace(/[.!?؟]$/, '').split(' ').length);
        onFinalTranscript(finalText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      const isArabic = language === 'ar';
      let errorMessage = isArabic ? 'خطأ في التعرف على الصوت' : 'Speech recognition error';
      let errorDescription = isArabic ? 'الرجاء المحاولة مرة أخرى' : 'Please try again';
      
      if (event.error === 'not-allowed') {
        errorMessage = isArabic ? 'تم رفض الوصول للميكروفون' : 'Microphone access denied';
        errorDescription = isArabic ? 'الرجاء السماح بالوصول للميكروفون' : 'Please allow microphone access';
        setError(errorMessage);
      } else if (event.error === 'no-speech') {
        errorMessage = isArabic ? 'لم يتم اكتشاف صوت' : 'No speech detected';
        errorDescription = isArabic ? 'تحدث بوضوح أكثر' : 'Speak more clearly';
        
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log('Retrying speech recognition, attempt:', retryCountRef.current);
          setTimeout(() => startListening(), 1000);
          return;
        }
        setError(errorMessage);
      } else if (event.error === 'network') {
        errorMessage = isArabic ? 'خطأ في الشبكة' : 'Network error';
        errorDescription = isArabic ? 'تحقق من الاتصال' : 'Check connection';
        setError(errorMessage);
      } else if (event.error === 'language-not-supported') {
        errorMessage = isArabic ? 'اللغة غير مدعومة' : 'Language not supported';
        errorDescription = isArabic ? 'جرب لغة أخرى' : 'Try another language';
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive",
      });
    };

    return recognition;
  }, [language, onTranscriptChange, onFinalTranscript, toast, deduplicateTranscript, getLanguageConfig]);

  const startListening = useCallback(() => {
    if (isListening) return;
    
    const recognition = initializeRecognition();
    if (!recognition) {
      const isArabic = language === 'ar';
      const errorMsg = isArabic ? 'التعرف على الصوت غير مدعوم' : 'Speech recognition not supported';
      setError(errorMsg);
      toast({
        title: isArabic ? "غير مدعوم" : "Not Supported",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      const langConfig = getLanguageConfig(language);
      toast({
        title: language === 'ar' ? 'بدء الاستماع للعربية' : 'Listening for English',
        description: language === 'ar' ? 'تحدث الآن بوضوح' : 'Speak now clearly',
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      const isArabic = language === 'ar';
      setError(isArabic ? 'فشل في بدء التسجيل' : 'Failed to start recording');
    }
  }, [isListening, initializeRecognition, language, toast, getLanguageConfig]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping speech recognition');
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [isListening]);

  const retryListening = useCallback(() => {
    setError(null);
    retryCountRef.current = 0;
    startListening();
  }, [startListening]);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    retryListening,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
};
