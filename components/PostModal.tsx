
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar as CalendarIcon, 
  Clock, 
  Type, 
  Smile, 
  ChevronDown, 
  ChevronUp,
  LayoutGrid,
  AlertCircle
} from 'lucide-react';
import { Platform, SocialPost } from '../types';
import { generatePostContent } from '../services/ai';
import { Button } from './Button';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: SocialPost) => void;
  initialDate?: Date;
  initialPlatform?: Platform;
}

const BACKGROUNDS = [
  { id: 'none', class: 'bg-white', text: 'text-gray-900', label: 'None' },
  { id: 'simple-1', class: 'bg-white', text: 'text-gray-900', icon: 'grid', label: 'Default' },
  { id: 'purple', class: 'bg-fuchsia-700', text: 'text-white', label: 'Purple' },
  { id: 'red', class: 'bg-red-600', text: 'text-white', label: 'Red' },
  { id: 'black', class: 'bg-gray-900', text: 'text-white', label: 'Black' },
  { id: 'grad-1', class: 'bg-gradient-to-br from-pink-500 to-purple-600', text: 'text-white', label: 'Pink Purple' },
  { id: 'grad-2', class: 'bg-gradient-to-br from-violet-600 to-indigo-600', text: 'text-white', label: 'Violet' },
  { id: 'grad-3', class: 'bg-gradient-to-br from-orange-400 to-pink-500', text: 'text-white', label: 'Sunset' },
  { id: 'grad-4', class: 'bg-gradient-to-br from-slate-800 to-black', text: 'text-white', label: 'Dark' },
  { id: 'grad-5', class: 'bg-gradient-to-br from-indigo-900 to-purple-900', text: 'text-white', label: 'Deep Space' },
];

const FB_BG_CHAR_LIMIT = 130;

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSave, initialDate, initialPlatform }) => {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<Platform>(initialPlatform || Platform.Facebook);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptTopic, setPromptTopic] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  
  // Facebook Specific Features
  const [postType, setPostType] = useState<'Feed' | 'Reel' | 'Story'>('Feed');
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<string>('none');
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // Auto-resize ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      const d = initialDate || new Date();
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toTimeString().slice(0, 5));
      setPlatform(initialPlatform || Platform.Facebook);
      setContent('');
      setShowAiPrompt(false);
      // Reset FB specific states
      setSelectedBackground('none');
      setShowBackgroundPicker(false);
      setPostType('Feed');
    }
  }, [isOpen, initialDate, initialPlatform]);

  // Dynamic font sizing based on length - Increased sizes to match FB bold style
  const getDynamicFontSize = (textLength: number) => {
    if (textLength < 40) return 'text-5xl font-bold leading-tight';
    if (textLength < 85) return 'text-4xl font-bold leading-tight';
    return 'text-3xl font-bold leading-snug';
  };

  // Auto-resize textarea to fit content perfectly, allowing flex container to center it
  useLayoutEffect(() => {
    const isFacebook = platform === Platform.Facebook;
    const isColoredBackground = isFacebook && postType === 'Feed' && selectedBackground !== 'none';
    
    if (isColoredBackground && textareaRef.current) {
      // Reset height to auto to shrink if text was deleted
      textareaRef.current.style.height = 'auto';
      // Set to scrollHeight to fit content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, selectedBackground, platform, postType]);

  const handleGenerate = async () => {
    if (!promptTopic) return;
    setIsGenerating(true);
    try {
      const generatedText = await generatePostContent(promptTopic, platform);
      setContent(generatedText);
      setShowAiPrompt(false);
    } catch (error) {
      alert("Failed to generate content. Ensure API Key is valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const dateTime = new Date(`${date}T${time}`);
    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      date: dateTime,
      durationMinutes: 60,
      platform,
      isDraft: false
    };
    onSave(newPost);
    onClose();
  };

  const activeBg = BACKGROUNDS.find(b => b.id === selectedBackground) || BACKGROUNDS[0];
  const isFacebook = platform === Platform.Facebook;
  const isColoredBackground = isFacebook && postType === 'Feed' && selectedBackground !== 'none';
  const isOverLimit = isColoredBackground && content.length > FB_BG_CHAR_LIMIT;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
                platform === Platform.Instagram ? 'bg-pink-500' : 'bg-blue-600'
            }`}></span>
            New Post
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Platform Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Select Profile</label>
            <div className="flex gap-2 flex-wrap">
              {Object.values(Platform).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    platform === p 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
              {/* Text Editor Area */}
              <div className={`border rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all ${isOverLimit ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}>
                
                {isColoredBackground ? (
                  // FB Background View: Flex container for perfect centering
                  // Using h-[360px] to mimic typical FB square-ish preview
                  <div className={`w-full h-[360px] flex items-center justify-center p-12 transition-colors duration-300 ${activeBg.class}`}>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What's on your mind?"
                      rows={1}
                      className={`w-full max-h-full bg-transparent ${getDynamicFontSize(content.length)} text-center resize-none outline-none overflow-hidden placeholder-white/60 tracking-wide caret-current ${activeBg.text}`}
                      style={{ padding: 0 }} 
                    />
                  </div>
                ) : (
                  // Standard View
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-white text-gray-800 text-sm h-48 p-4 resize-none outline-none"
                  />
                )}
                
                {/* Editor Toolbar */}
                <div className="bg-white border-t border-gray-100 p-2 flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-1">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Smile size={18} />
                      </button>
                      
                      {/* Facebook Background Toggle */}
                      {isFacebook && postType === 'Feed' && (
                        <div className="relative">
                            
                             {/* Floating Tooltip/Warning - Only show if over limit */}
                             {isOverLimit && (
                                <div className="absolute bottom-full left-0 mb-3 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 pointer-events-none z-50">
                                    <h4 className="font-bold mb-1.5 text-red-300 flex items-center gap-1.5">
                                        <AlertCircle size={12} />
                                        Limit Exceeded
                                    </h4>
                                    <ul className="space-y-1 text-gray-300">
                                        <li className="text-red-200 font-bold">
                                            - Maximum {FB_BG_CHAR_LIMIT} characters allowed
                                        </li>
                                        <li>- Exclusive to Facebook Pages</li>
                                        <li>- Limited to Feed posts (Text only)</li>
                                    </ul>
                                     {/* Arrow */}
                                     <div className="absolute top-full left-3 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                             )}

                            <button 
                                onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                    showBackgroundPicker || isColoredBackground
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 font-bold bg-indigo-50' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Background Color"
                            >
                                <Type size={18} className={showBackgroundPicker || isColoredBackground ? 'text-indigo-600' : ''} />
                            </button>
                        </div>
                      )}

                      <button 
                        onClick={() => setShowAiPrompt(!showAiPrompt)}
                        className={`ml-2 flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors ${
                            showAiPrompt ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        <Sparkles size={14} />
                        AI Assist
                      </button>
                   </div>
                   
                   <span className={`text-xs font-medium transition-colors ${
                       isOverLimit 
                         ? 'text-red-600 font-bold' 
                         : 'text-gray-400'
                   }`}>
                      {content.length} {isColoredBackground ? `/ ${FB_BG_CHAR_LIMIT}` : ''} chars
                   </span>
                </div>

                {/* Color Picker Slide-out */}
                {isFacebook && showBackgroundPicker && postType === 'Feed' && (
                    <div className="bg-gray-50 border-t border-gray-100 p-3 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                            {/* Reset Button */}
                            <button 
                                onClick={() => setSelectedBackground('none')}
                                className={`w-8 h-8 rounded-lg border flex-shrink-0 flex items-center justify-center bg-white transition-all ${selectedBackground === 'none' ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-300'}`}
                                title="No Background"
                            >
                                <div className="w-full h-full rounded-lg flex items-center justify-center">
                                   <div className="w-4 h-4 border border-gray-300 bg-white"></div>
                                </div>
                            </button>
                            
                            {/* Color Options */}
                            {BACKGROUNDS.filter(b => b.id !== 'none' && b.id !== 'simple-1').map((bg) => (
                                <button
                                    key={bg.id}
                                    onClick={() => setSelectedBackground(bg.id)}
                                    className={`w-8 h-8 rounded-lg flex-shrink-0 transition-all transform hover:scale-110 ${bg.class} ${
                                        selectedBackground === bg.id ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : ''
                                    }`}
                                    title={bg.label}
                                />
                            ))}
                            
                             {/* Mock Grid Option */}
                             <button className="w-8 h-8 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center text-white/50">
                                <LayoutGrid size={16} />
                             </button>
                        </div>
                    </div>
                )}
              </div>

              {/* AI Prompt Input (Conditional) */}
              {showAiPrompt && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-2 animate-in fade-in">
                    <input 
                      type="text" 
                      value={promptTopic}
                      onChange={(e) => setPromptTopic(e.target.value)}
                      className="flex-1 text-sm border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      placeholder="What should this post be about?"
                    />
                    <Button size="sm" onClick={handleGenerate} isLoading={isGenerating}>
                      Generate
                    </Button>
                </div>
              )}

              {/* Media Section */}
              {selectedBackground === 'none' ? (
                  <div className="group border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer">
                    <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon size={24} className="text-gray-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Add Photos or Video</span>
                    <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
                 </div>
              ) : (
                  <div className={`border rounded-lg p-3 flex items-start gap-3 text-sm transition-colors ${isOverLimit ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                          <p className="font-semibold">{isOverLimit ? 'Character limit exceeded' : 'Media disabled'}</p>
                          <p className={`text-xs ${isOverLimit ? 'text-red-700' : 'text-amber-700/80'}`}>
                              {isOverLimit 
                                ? `Please reduce text to ${FB_BG_CHAR_LIMIT} characters or remove the background to post.`
                                : 'Colored backgrounds are only available for text-only posts on Facebook.'}
                          </p>
                      </div>
                  </div>
              )}
             
             {/* Facebook Settings Accordion */}
             {isFacebook && (
                 <div className="border border-gray-200 rounded-xl overflow-hidden">
                     <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
                     >
                         <span className="flex items-center gap-2">
                             <span className="w-5 h-5 bg-[#1877F2] text-white rounded flex items-center justify-center text-[10px] font-bold">f</span>
                             Facebook Settings
                         </span>
                         {isSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                     </button>
                     
                     {isSettingsOpen && (
                         <div className="p-4 bg-white border-t border-gray-200 space-y-4 animate-in slide-in-from-top-1">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Post Type</label>
                                     <div className="relative">
                                         <select 
                                            value={postType}
                                            onChange={(e) => {
                                                setPostType(e.target.value as any);
                                                if(e.target.value !== 'Feed') setSelectedBackground('none');
                                            }}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none"
                                         >
                                             <option value="Feed">Feed Post</option>
                                             <option value="Reel">Reel</option>
                                             <option value="Story">Story</option>
                                         </select>
                                         <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                     </div>
                                     <p className="text-[10px] text-gray-400 mt-1.5">
                                         {postType === 'Feed' ? 'Up to 10 images or a video (not both).' : 
                                          postType === 'Reel' ? 'Only single video allowed.' : 
                                          'Single or up to 10 images, videos, or a mix.'}
                                     </p>
                                 </div>
                                 
                                 <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Who can comment?</label>
                                      <div className="relative">
                                         <select className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-sm text-gray-500 focus:ring-2 focus:ring-indigo-100 outline-none" disabled>
                                             <option>Public</option>
                                             <option>Followers only</option>
                                         </select>
                                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
             )}

              {/* Scheduling Section */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <CalendarIcon size={14} /> Date
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock size={14} /> Time
                  </label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-sm border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={(!content && !promptTopic) || isOverLimit}>
              {date ? 'Schedule Post' : 'Post Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};
