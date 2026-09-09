import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe, Sparkles, Check } from 'lucide-react';


interface VoiceGrievanceRecorderProps {
  onTranscript: (text: string) => void;
  className?: string;
  initialLanguage?: 'en-IN' | 'mr-IN' | 'hi-IN';
}

export const VoiceGrievanceRecorder: React.FC<VoiceGrievanceRecorderProps> = ({
  onTranscript,
  className = '',
  initialLanguage = 'en-IN',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<'en-IN' | 'mr-IN' | 'hi-IN'>(initialLanguage);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      onTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech Recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [language, onTranscript]);

  const toggleRecording = () => {
    if (!isSupported) return;

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsRecording(false);
    } else {
      setTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language;
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.warn('Failed to start voice recognition:', e);
        }
      }
    }
  };

  if (!isSupported) {
    return null; // Gracefully hidden on unsupported browsers
  }

  return (
    <div className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`relative p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105 animate-pulse'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Voice Grievance'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording && (
              <span className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping opacity-75" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRecording ? 'Listening (बोलिए / बोला)...' : 'Voice Grievance Intake'}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isRecording ? 'Speak clearly into your microphone' : 'Tap mic to speak your complaint'}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <Globe className="w-3 h-3 text-slate-400 ml-1" />
          <button
            type="button"
            onClick={() => setLanguage('en-IN')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              language === 'en-IN'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('mr-IN')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              language === 'mr-IN'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi-IN')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              language === 'hi-IN'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Live Audio Waveform Simulation when recording */}
      {isRecording && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 h-5">
            {[40, 80, 20, 90, 60, 100, 30, 75, 45, 95, 35, 70].map((h, idx) => (
              <span
                key={idx}
                className="w-1 bg-primary-500 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.4 + (idx % 4) * 0.2}s`,
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono text-primary-600 dark:text-primary-400 font-semibold animate-pulse">
            LIVE TRANSCRIPTION ACTIVE
          </span>
        </div>
      )}

      {/* Interim Transcript preview */}
      {transcript && !isRecording && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Check className="w-3.5 h-3.5" />
          <span>Voice transcribed & inserted into description</span>
        </div>
      )}
    </div>
  );
};
