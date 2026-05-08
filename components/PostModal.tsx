
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
  editingPost?: SocialPost | null;
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

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSave, initialDate, initialPlatform, editingPost }) => {
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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mediaFile) {
      const url = URL.createObjectURL(mediaFile);
      setMediaPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setMediaPreviewUrl(null);
    }
  }, [mediaFile]);

  const COMMON_EMOJIS = [
    '😀','😂','❤️','👍','🙏','🎉','🔥','✨','💪','🚀',
    '👀','💡','⭐','🌟','💯','✅','🎯','📅','📱','💬'
  ];

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Auto-resize ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingPost) {
        const d = new Date(editingPost.date);
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().slice(0, 5));
        setPlatform(editingPost.platform);
        setContent(editingPost.content);
      } else {
        const d = initialDate || new Date();
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().slice(0, 5));
        setPlatform(initialPlatform || Platform.Facebook);
        setContent('');
      }
      setShowAiPrompt(false);
      setShowEmojiPicker(false);
      setMediaFile(null);
      setMediaPreviewUrl(null);
      setSelectedBackground('none');
      setShowBackgroundPicker(false);
      setPostType('Feed');
    }
  }, [isOpen, initialDate, initialPlatform, editingPost]);

  // Dynamic font sizing based on length - Increased sizes to match FB bold style
  const getDynamicFontSize = (textLength: number) => {
    if (textLength < 40) return 'text-5xl font-bold leading-tight';
    if (textLength < 85) return 'text-4xl font-bold leading-tight';
    return 'text-3xl font-bold leading-snug';
  };

  // Auto-resize textarea to fit content. Only expand when there IS content —
  // avoid setting height on first mount when scrollHeight may still be 0.
  useLayoutEffect(() => {
    const isFb = platform === Platform.Facebook;
    const isColored = isFb && postType === 'Feed' && selectedBackground !== 'none';
    if (!isColored || !textareaRef.current) return;

    if (content.length > 0) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    } else {
      textareaRef.current.style.height = '';
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
    const post: SocialPost = {
      id: editingPost?.id ?? Math.random().toString(36).substr(2, 9),
      content,
      date: dateTime,
      durationMinutes: editingPost?.durationMinutes ?? 60,
      platform,
      mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : editingPost?.mediaUrl,
      isDraft: false
    };
    onSave(post);
    onClose();
  };

  const activeBg = BACKGROUNDS.find(b => b.id === selectedBackground) || BACKGROUNDS[0];
  const isFacebook = platform === Platform.Facebook;
  const isColoredBackground = isFacebook && postType === 'Feed' && selectedBackground !== 'none';
  const isOverLimit = isColoredBackground && content.length > FB_BG_CHAR_LIMIT;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${platform === Platform.Instagram ? 'bg-pink-500' : 'bg-blue-600'}`}></span>
            {editingPost ? 'Edit Post' : 'New Post'}
          </h2>
          <button type="button" title="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Content editor */}
          <div className="flex-1 flex flex-col border-r border-gray-100 overflow-y-auto custom-scrollbar p-5 gap-4">

            {/* Platform Selector */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Select Profile</label>
              <div className="flex gap-2">
                {Object.values(Platform).map((p) => (
                  <button type="button" key={p} onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      platform === p ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Editor */}
            <div className={`border rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all ${isOverLimit ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}>
              {isColoredBackground ? (
                <div className={`w-full h-56 flex items-center justify-center p-8 ${activeBg.class}`}>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={1}
                    className={`w-full bg-transparent ${getDynamicFontSize(content.length)} text-center resize-none outline-none overflow-y-hidden tracking-wide placeholder:text-white/50`}
                    style={{ padding: 0, color: '#ffffff', caretColor: '#ffffff' }}
                  />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-white text-gray-800 text-sm h-40 p-4 resize-none outline-none"
                />
              )}

              {/* Toolbar */}
              <div className="bg-white border-t border-gray-100 px-2 py-1.5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button type="button" title="Insert emoji"
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Smile size={16} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 w-56">
                        <div className="grid grid-cols-10 gap-0.5">
                          {COMMON_EMOJIS.map(emoji => (
                            <button type="button" key={emoji} title={emoji} onClick={() => insertEmoji(emoji)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-base">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isFacebook && postType === 'Feed' && (
                    <div className="relative group">
                      <button type="button" onClick={() => {
                          if (showBackgroundPicker) setSelectedBackground('none');
                          setShowBackgroundPicker(!showBackgroundPicker);
                        }}
                        title="Facebook Text Background"
                        className={`p-1.5 rounded-lg transition-colors ${showBackgroundPicker || isColoredBackground ? 'bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                        <Type size={16} className={showBackgroundPicker || isColoredBackground ? 'text-indigo-600' : ''} />
                      </button>
                      <div className="absolute bottom-full left-0 mb-2 w-52 bg-gray-900 text-white rounded-lg p-3 hidden group-hover:block z-50 pointer-events-none shadow-xl">
                        <p className="text-[11px] font-semibold mb-1.5">Facebook Text Background</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">· Exclusive to Facebook Pages</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">· Limited to Feed posts (text only)</p>
                      </div>
                    </div>
                  )}

                  <button type="button" onClick={() => setShowAiPrompt(!showAiPrompt)}
                    className={`ml-1 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${showAiPrompt ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                    <Sparkles size={13} />
                    AI Assist
                  </button>
                </div>
                <span className={`text-xs font-medium ${isOverLimit ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                  {content.length}{isColoredBackground ? ` / ${FB_BG_CHAR_LIMIT}` : ''} chars
                </span>
              </div>

              {/* Color Picker */}
              {isFacebook && showBackgroundPicker && postType === 'Feed' && (
                <div className="bg-gray-50 border-t border-gray-100 p-2.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                    <button type="button" onClick={() => setSelectedBackground('none')}
                      className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center bg-white transition-all ${selectedBackground === 'none' ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-300'}`}
                      title="No Background">
                      <div className="w-2.5 h-2.5 border border-gray-300 bg-white" />
                    </button>
                    {BACKGROUNDS.filter(b => b.id !== 'none' && b.id !== 'simple-1').map((bg) => (
                      <button type="button" key={bg.id} onClick={() => setSelectedBackground(bg.id)}
                        className={`w-5 h-5 rounded-md flex-shrink-0 transition-all hover:scale-110 ${bg.class} ${selectedBackground === bg.id ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : ''}`}
                        title={bg.label} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Prompt */}
            {showAiPrompt && (
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
                <input type="text" value={promptTopic} onChange={(e) => setPromptTopic(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
                  placeholder="What should this post be about?" />
                <Button size="sm" onClick={handleGenerate} isLoading={isGenerating}>Generate</Button>
              </div>
            )}
          </div>

          {/* RIGHT: Settings panel */}
          <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar p-5 gap-4 bg-gray-50/50">

            {/* Date & Time */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Schedule</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 flex items-center gap-1"><CalendarIcon size={10} /> Date</label>
                  <input type="date" title="Post date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Clock size={10} /> Time</label>
                  <input type="time" title="Post time" value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>
              </div>
            </div>

            {/* Media */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Media</label>
              {selectedBackground !== 'none' ? (
                <div className={`border rounded-lg p-2.5 flex items-start gap-2 text-xs ${isOverLimit ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{isOverLimit ? 'Limit exceeded' : 'Media disabled'}</p>
                    <p className={`text-[10px] mt-0.5 ${isOverLimit ? 'text-red-700' : 'text-amber-700/80'}`}>
                      {isOverLimit ? `Max ${FB_BG_CHAR_LIMIT} chars with background.` : 'Text-only when using colored backgrounds.'}
                    </p>
                  </div>
                </div>
              ) : mediaFile && mediaPreviewUrl ? (
                <div className="flex flex-col gap-1.5">
                  <div className={`relative rounded-xl overflow-hidden border border-gray-200 group ${
                    postType === 'Feed' ? 'w-full aspect-[4/5]' : 'w-44 mx-auto aspect-[9/16]'
                  }`}>
                    {mediaFile.type.startsWith('video/') ? (
                      <video src={mediaPreviewUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={mediaPreviewUrl} alt="Media preview" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                      {postType === 'Feed' ? '4:5' : '9:16'} · {postType}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" title="Change media" onClick={() => fileInputRef.current?.click()}
                          className="bg-white/90 hover:bg-white text-gray-700 rounded-lg p-1.5 shadow-sm">
                          <ImageIcon size={12} />
                        </button>
                        <button type="button" title="Remove media" onClick={() => setMediaFile(null)}
                          className="bg-white/90 hover:bg-white text-red-500 rounded-lg p-1.5 shadow-sm">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center truncate px-1">{mediaFile.name}</p>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()}
                  className="group border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer">
                  <div className="bg-gray-100 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <ImageIcon size={18} className="text-gray-500" />
                  </div>
                  <span className="text-xs text-gray-500">Add Photos or Video</span>
                </div>
              )}
            </div>

            {/* Facebook Settings */}
            {isFacebook && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-[#1877F2] text-white rounded flex items-center justify-center text-[9px] font-bold">f</span>
                  Facebook Settings
                </label>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Post Type</label>
                    <div className="relative">
                      <select title="Post Type" value={postType}
                        onChange={(e) => { setPostType(e.target.value as any); if (e.target.value !== 'Feed') setSelectedBackground('none'); }}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-7 text-xs focus:ring-2 focus:ring-indigo-100 outline-none">
                        <option value="Feed">Feed Post</option>
                        <option value="Reel">Reel</option>
                        <option value="Story">Story</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Who Can Comment?</label>
                    <div className="relative">
                      <select title="Who can comment?" className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-7 text-xs text-gray-400 outline-none" disabled>
                        <option>Public</option>
                        <option>Followers only</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-3 bg-white flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!content || isOverLimit}>
            {editingPost ? 'Save Changes' : (date ? 'Schedule Post' : 'Post Now')}
          </Button>
        </div>

        <input type="file" title="Upload photo or video" ref={fileInputRef}
          onChange={(e) => { if (e.target.files?.[0]) setMediaFile(e.target.files[0]); }}
          accept="image/*,video/*" className="hidden" />
      </div>
    </div>
  );
};
