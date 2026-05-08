import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  ArrowLeft, Sparkles, Smile, Type, Image as ImageIcon,
  Calendar as CalendarIcon, Clock, ChevronDown, AlertCircle, X, Eye,
  Hash, RefreshCw, Check, CheckCircle2,
} from 'lucide-react';
import { Platform, SocialPost, FacebookPage } from '../types';
import { generatePostContent, generateHashtags } from '../services/ai';
import { Button } from './Button';
import { PostPreviewCard } from './PostPreviewCard';
import styles from './PostComposer.module.css';

const BACKGROUNDS = [
  { id: 'none',   class: 'bg-white',                                          label: 'None' },
  { id: 'purple', class: 'bg-fuchsia-700',                                    label: 'Purple' },
  { id: 'red',    class: 'bg-red-600',                                        label: 'Red' },
  { id: 'black',  class: 'bg-gray-900',                                       label: 'Black' },
  { id: 'grad-1', class: 'bg-gradient-to-br from-pink-500 to-purple-600',     label: 'Pink Purple' },
  { id: 'grad-2', class: 'bg-gradient-to-br from-violet-600 to-indigo-600',   label: 'Violet' },
  { id: 'grad-3', class: 'bg-gradient-to-br from-orange-400 to-pink-500',     label: 'Sunset' },
  { id: 'grad-4', class: 'bg-gradient-to-br from-slate-800 to-black',         label: 'Dark' },
  { id: 'grad-5', class: 'bg-gradient-to-br from-indigo-900 to-purple-900',   label: 'Deep Space' },
];

const FB_BG_CHAR_LIMIT = 130;

const COMMON_EMOJIS = [
  '😀','😂','❤️','👍','🙏','🎉','🔥','✨','💪','🚀',
  '👀','💡','⭐','🌟','💯','✅','🎯','📅','📱','💬',
];

// ── Canvas rendering for colored-background posts ──────────────────────────

type CanvasPainter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const BG_CANVAS_PAINTERS: Record<string, CanvasPainter> = {
  'none':   (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); },
  'purple': (ctx, w, h) => { ctx.fillStyle = '#a21caf'; ctx.fillRect(0, 0, w, h); },
  'red':    (ctx, w, h) => { ctx.fillStyle = '#dc2626'; ctx.fillRect(0, 0, w, h); },
  'black':  (ctx, w, h) => { ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, w, h); },
  'grad-1': (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ec4899'); g.addColorStop(1, '#9333ea'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); },
  'grad-2': (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#7c3aed'); g.addColorStop(1, '#4f46e5'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); },
  'grad-3': (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#fb923c'); g.addColorStop(1, '#ec4899'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); },
  'grad-4': (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1e293b'); g.addColorStop(1, '#000000'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); },
  'grad-5': (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#581c87'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); },
};

const wrapTextOnCanvas = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const renderColoredPostToBase64 = async (text: string, bgId: string): Promise<string> => {
  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // Draw background
  (BG_CANVAS_PAINTERS[bgId] ?? BG_CANVAS_PAINTERS['none'])(ctx, SIZE, SIZE);

  // Choose font size based on text length (mirrors the live editor logic)
  const fontSize = text.length < 40 ? 80 : text.length < 85 ? 62 : 48;
  ctx.font         = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle    = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Soft text shadow for legibility
  ctx.shadowColor   = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur    = 10;
  ctx.shadowOffsetY = 3;

  const maxTextWidth = SIZE * 0.8;
  const lines        = wrapTextOnCanvas(ctx, text, maxTextWidth);
  const lineHeight   = fontSize * 1.35;
  let y = SIZE / 2 - (lines.length * lineHeight) / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, SIZE / 2, y);
    y += lineHeight;
  }

  return canvas.toDataURL('image/jpeg', 0.92);
};

// ───────────────────────────────────────────────────────────────────────────

interface PostComposerProps {
  onBack: () => void;
  onSave: (post: SocialPost) => void;
  initialDate?: Date;
  initialPlatform?: Platform;
  editingPost?: SocialPost | null;
  connectedPages?: FacebookPage[];
}

export const PostComposer: React.FC<PostComposerProps> = ({
  onBack,
  onSave,
  initialDate,
  initialPlatform,
  editingPost,
  connectedPages = [] as FacebookPage[],
}) => {
  const [content, setContent]                         = useState('');
  const [platform, setPlatform]                       = useState<Platform>(initialPlatform || Platform.Facebook);
  const [date, setDate]                               = useState('');
  const [time, setTime]                               = useState('');
  const [isGenerating, setIsGenerating]               = useState(false);
  const [promptTopic, setPromptTopic]                 = useState('');
  const [showAiPrompt, setShowAiPrompt]               = useState(false);
  const [postType, setPostType]                       = useState<'Feed' | 'Reel' | 'Story'>('Feed');
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [selectedBackground, setSelectedBackground]   = useState('none');
  const [showEmojiPicker, setShowEmojiPicker]         = useState(false);
  const [mediaFile, setMediaFile]                     = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl]         = useState<string | null>(null);
  const [suggestedHashtags, setSuggestedHashtags]     = useState<string[]>([]);
  const [isLoadingHashtags, setIsLoadingHashtags]     = useState(false);
  const [hashtagsSeeded, setHashtagsSeeded]           = useState(false);
  const [hashtagFetchDone, setHashtagFetchDone]       = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Seed state from props on mount */
  useEffect(() => {
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
    }
  }, []); // intentionally run once

  /* Object URL for media preview */
  useEffect(() => {
    if (!mediaFile) { setMediaPreviewUrl(null); return; }
    const url = URL.createObjectURL(mediaFile);
    setMediaPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  /* Auto-trigger hashtag suggestions once content is long enough */
  useEffect(() => {
    if (content.length >= 30 && !hashtagsSeeded && !isLoadingHashtags) {
      fetchHashtags();
    }
    if (content.length < 10) {
      setSuggestedHashtags([]);
      setHashtagsSeeded(false);
      setHashtagFetchDone(false);
    }
  }, [content]);

  const fetchHashtags = async () => {
    if (!content || content.length < 10) return;
    setIsLoadingHashtags(true);
    try {
      const tags = await generateHashtags(content, platform);
      setSuggestedHashtags(tags);
    } catch {
      setSuggestedHashtags([]);
    } finally {
      setIsLoadingHashtags(false);
      setHashtagsSeeded(true);
      setHashtagFetchDone(true);
    }
  };

  /* Auto-resize colored-bg textarea */
  useLayoutEffect(() => {
    const isColored = platform === Platform.Facebook && postType === 'Feed' && selectedBackground !== 'none';
    if (!isColored || !textareaRef.current) return;
    if (content.length > 0) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    } else {
      textareaRef.current.style.height = '';
    }
  }, [content, selectedBackground, platform, postType]);

  const isFacebook         = platform === Platform.Facebook;
  const isColoredBackground = isFacebook && postType === 'Feed' && selectedBackground !== 'none';
  const isOverLimit         = isColoredBackground && content.length > FB_BG_CHAR_LIMIT;
  const activeBg            = BACKGROUNDS.find(b => b.id === selectedBackground) || BACKGROUNDS[0];

  const getDynamicFontSize = (len: number) => {
    if (len < 40) return 'text-5xl font-bold leading-tight';
    if (len < 85) return 'text-4xl font-bold leading-tight';
    return 'text-3xl font-bold leading-snug';
  };

  const handleGenerate = async () => {
    if (!promptTopic) return;
    setIsGenerating(true);
    try {
      setContent(await generatePostContent(promptTopic, platform));
      setShowAiPrompt(false);
    } catch {
      alert('Failed to generate content. Ensure API Key is valid.');
    } finally {
      setIsGenerating(false);
    }
  };

  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ ok: boolean; message: string } | null>(null);

  const buildPost = (overrideDate?: Date): SocialPost => ({
    id: editingPost?.id ?? Math.random().toString(36).substring(2, 11),
    content,
    date: overrideDate ?? new Date(`${date}T${time}`),
    durationMinutes: editingPost?.durationMinutes ?? 60,
    platform,
    mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : editingPost?.mediaUrl,
    isDraft: false,
  });

  const handleSave = () => {
    onSave(buildPost());
    onBack();
  };

  const handlePostNow = async () => {
    const post = buildPost(new Date());
    onSave(post);

    const fbPage = platform === Platform.Facebook && connectedPages.length > 0
      ? connectedPages[0]
      : null;

    if (fbPage && (window.electronAPI?.postToFacebook || window.electronAPI?.postImageToFacebook)) {
      setIsPosting(true);
      try {
        let result: { id?: string; error?: string };

        if (isColoredBackground) {
          // Render compose box to a 1080×1080 JPEG and post as photo
          const imageBase64 = await renderColoredPostToBase64(content, selectedBackground);
          result = await window.electronAPI.postImageToFacebook({
            pageId: fbPage.id,
            imageBase64,
            caption: content,
          });
        } else {
          result = await window.electronAPI.postToFacebook({ pageId: fbPage.id, message: content });
        }

        if (result.id) {
          onSave({ ...post, fbPostId: result.id });
          setPostResult({ ok: true, message: `Published to Facebook — post ID ${result.id}` });
        } else {
          const errMsg = result.error ?? 'Post failed. Saved as draft.';
          onSave({ ...post, publishError: errMsg });
          setPostResult({ ok: false, message: errMsg });
        }
      } catch {
        const errMsg = 'Could not reach Facebook. Saved locally.';
        onSave({ ...post, publishError: errMsg });
        setPostResult({ ok: false, message: errMsg });
      } finally {
        setIsPosting(false);
        setTimeout(onBack, 2800);
      }
    } else {
      onBack();
    }
  };

  /* ── Render ── */
  return (
    <div className="flex flex-col h-screen bg-app-bg overflow-hidden font-sans text-app-text">

      {/* ── Top header bar ── */}
      <header className={`px-5 py-3 flex items-center gap-4 flex-shrink-0 z-20 ${styles.topHeader}`}>

        {/* Back */}
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-app-text-3 hover:text-app-text-2 transition-colors flex-shrink-0">
          <ArrowLeft size={15} />
          <span className="font-medium">Planner</span>
        </button>
        <div className="h-5 w-px bg-app-border flex-shrink-0" />

        {/* Title */}
        <div className="flex-shrink-0">
          <h1 className="text-sm font-semibold text-app-text leading-none">
            {editingPost ? 'Edit Post' : 'New Post'}
          </h1>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] bg-[rgba(255,140,66,0.12)] border border-[rgba(255,140,66,0.45)] text-app-orange-2 px-2 py-0.5 rounded mt-0.5 inline-block">
            unsaved draft
          </span>
        </div>

        {/* Platform tabs (centred) */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1 bg-app-surface-2 rounded-lg p-1 border border-app-border">
            {Object.values(Platform).map(p => (
              <button type="button" key={p} onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  platform === p
                    ? 'bg-[rgba(255,140,66,0.12)] border border-[rgba(255,140,66,0.45)] text-app-orange-2'
                    : 'text-app-text-3 hover:text-app-text-2'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onBack}>Cancel</Button>
          {!editingPost && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePostNow}
              disabled={!content || isOverLimit || isPosting}
              isLoading={isPosting}
            >
              Post Now
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={!content || isOverLimit}>
            {editingPost ? 'Save Changes' : 'Schedule Post'}
          </Button>
        </div>
      </header>

      {/* ── Post result toast ── */}
      {postResult && (
        <div className={`px-5 py-2.5 flex items-center gap-2.5 text-sm font-medium ${postResult.ok ? styles.toastSuccess : styles.toastError}`}>
          {postResult.ok
            ? <CheckCircle2 size={15} className="text-app-teal shrink-0" />
            : <AlertCircle  size={15} className="text-app-danger shrink-0" />}
          <span className={postResult.ok ? 'text-app-teal' : 'text-app-danger'}>
            {postResult.message}
          </span>
        </div>
      )}

      {/* ── Three-column body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Compose ── */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 gap-4 min-w-0 border-r border-[rgba(120,140,180,0.14)]">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-app-text-3 mb-2">Compose</label>

            <div className={`border rounded-xl overflow-visible shadow-sm transition-all bg-app-surface max-w-xl mx-auto w-full ${
              isOverLimit
                ? 'border-app-danger/50 ring-2 ring-app-danger/10'
                : 'border-[rgba(120,140,180,0.14)] focus-within:ring-2 focus-within:ring-[rgba(255,140,66,0.12)]'
            }`}>

              {/* Editor area — aspect ratio mirrors the live preview */}
              {isColoredBackground ? (
                <div className={`w-full flex items-center justify-center px-8 py-10 min-h-[350px] rounded-t-xl ${activeBg.class}`}>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={1}
                    className={`w-full bg-transparent ${getDynamicFontSize(content.length)} text-center resize-none outline-none overflow-y-hidden tracking-wide placeholder:text-white/50 ${styles.coloredTextarea}`}
                  />
                </div>
              ) : (
                <div className={`w-full ${postType === 'Feed' ? 'min-h-[200px]' : 'min-h-[280px]'} relative rounded-t-xl overflow-hidden`}>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="What's on your mind? Start writing your post..."
                    className="absolute inset-0 w-full h-full text-app-text text-sm p-4 resize-none outline-none bg-transparent placeholder:text-app-text-3"
                  />
                </div>
              )}

              {/* Toolbar */}
              <div className="bg-app-surface-2 border-t border-[rgba(120,140,180,0.14)] px-3 py-2 flex items-center justify-between relative z-10 rounded-b-xl">
                <div className="flex items-center gap-1">

                  {/* Emoji */}
                  <div className="relative">
                    <button type="button" title="Insert emoji"
                      onClick={() => setShowEmojiPicker(v => !v)}
                      className="p-1.5 text-app-text-3 hover:text-app-text-2 hover:bg-app-surface-3 rounded-lg transition-colors">
                      <Smile size={16} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-app-surface border border-[rgba(120,140,180,0.14)] rounded-xl shadow-lg p-3 z-50 w-56">
                        <div className="grid grid-cols-10 gap-0.5">
                          {COMMON_EMOJIS.map(e => (
                            <button type="button" key={e} title={e}
                              onClick={() => { setContent(p => p + e); setShowEmojiPicker(false); }}
                              className="w-7 h-7 flex items-center justify-center hover:bg-app-surface-3 rounded text-base">
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text background (FB Feed only) */}
                  {isFacebook && postType === 'Feed' && (
                    <div className="relative group">
                      <button type="button" title="Facebook Text Background"
                        onClick={() => {
                          if (showBackgroundPicker) setSelectedBackground('none');
                          setShowBackgroundPicker(v => !v);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          showBackgroundPicker || isColoredBackground
                            ? 'bg-[rgba(255,140,66,0.12)] border border-[rgba(255,140,66,0.45)] text-app-orange-2'
                            : 'text-app-text-3 hover:text-app-text-2 hover:bg-app-surface-3'
                        }`}>
                        <Type size={16} />
                      </button>
                      <div className="absolute bottom-full left-0 mb-2 w-52 bg-gray-900 text-white rounded-lg p-3 hidden group-hover:block z-50 pointer-events-none shadow-xl">
                        <p className="text-[11px] font-semibold mb-1.5">Facebook Text Background</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">· Exclusive to Facebook Pages</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">· Limited to Feed posts (text only)</p>
                      </div>
                    </div>
                  )}

                  {/* AI Assist */}
                  <button type="button"
                    onClick={() => setShowAiPrompt(v => !v)}
                    className={`ml-1 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                      showAiPrompt
                        ? 'bg-[rgba(255,140,66,0.18)] border border-[rgba(255,140,66,0.45)] text-app-orange-2'
                        : 'bg-[rgba(255,140,66,0.12)] border border-[rgba(255,140,66,0.45)] text-app-orange-2 hover:bg-[rgba(255,140,66,0.18)]'
                    }`}>
                    <Sparkles size={13} /> AI Assist
                  </button>
                </div>

                <span className={`text-xs font-medium ${isOverLimit ? 'text-app-danger font-bold' : 'text-app-text-3'}`}>
                  {content.length}{isColoredBackground ? ` / ${FB_BG_CHAR_LIMIT}` : ''} chars
                </span>
              </div>

              {/* Color swatches */}
              {isFacebook && showBackgroundPicker && postType === 'Feed' && (
                <div className="bg-app-surface-3 border-t border-[rgba(120,140,180,0.14)] p-2.5 rounded-b-xl">
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                    <button type="button" title="No background" onClick={() => setSelectedBackground('none')}
                      className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center bg-app-surface-2 transition-all ${
                        selectedBackground === 'none' ? 'ring-2 ring-app-orange border-transparent' : 'border-app-border'
                      }`}>
                      <div className="w-2.5 h-2.5 border border-app-border bg-app-surface-2" />
                    </button>
                    {BACKGROUNDS.filter(b => b.id !== 'none').map(bg => (
                      <button type="button" key={bg.id} title={bg.label} onClick={() => setSelectedBackground(bg.id)}
                        className={`w-5 h-5 rounded-md flex-shrink-0 transition-all hover:scale-110 ${bg.class} ${
                          selectedBackground === bg.id ? 'ring-2 ring-app-orange ring-offset-1 scale-110' : ''
                        }`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI prompt bar */}
            {showAiPrompt && (
              <div className="mt-3 bg-app-surface p-3 rounded-xl border border-[rgba(120,140,180,0.14)] flex items-center gap-2 max-w-xl mx-auto">
                <input type="text" value={promptTopic} onChange={e => setPromptTopic(e.target.value)}
                  className="flex-1 text-sm border border-app-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[rgba(255,140,66,0.12)] outline-none bg-app-surface-2 text-app-text placeholder:text-app-text-3"
                  placeholder="What should this post be about?" />
                <Button size="sm" onClick={handleGenerate} isLoading={isGenerating}>Generate</Button>
              </div>
            )}

            {/* Hashtag Suggestions */}
            {(isLoadingHashtags || hashtagFetchDone) && content.length >= 30 && (
              <div className="mt-3 bg-app-surface border border-[rgba(120,140,180,0.14)] rounded-xl p-3 max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-3 flex items-center gap-1">
                    <Hash size={10} /> Hashtag Suggestions
                  </span>
                  <button type="button" onClick={fetchHashtags} disabled={isLoadingHashtags}
                    className="flex items-center gap-1 text-[10px] text-app-text-3 hover:text-app-orange transition-colors disabled:opacity-40">
                    <RefreshCw size={10} className={isLoadingHashtags ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
                {isLoadingHashtags ? (
                  <div className="flex flex-wrap gap-1.5">
                    {['w-20', 'w-24', 'w-16', 'w-20', 'w-24', 'w-16', 'w-20', 'w-24'].map((w, i) => (
                      <div key={i} className={`h-6 ${w} bg-app-surface-3 rounded-full animate-pulse`} />
                    ))}
                  </div>
                ) : suggestedHashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedHashtags.map(tag => {
                      const isAdded = content.includes(tag);
                      return (
                        <button type="button" key={tag}
                          onClick={() => !isAdded && setContent(p => p + (p.endsWith(' ') || p === '' ? '' : ' ') + tag)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                            isAdded
                              ? 'bg-[rgba(255,140,66,0.12)] border border-[rgba(255,140,66,0.45)] text-app-orange-2 cursor-default'
                              : 'bg-app-surface-2 text-app-text-3 border border-app-border hover:border-[rgba(255,140,66,0.45)] hover:text-app-orange'
                          }`}>
                          {isAdded && <Check size={10} />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-app-text-3 italic">
                    Could not load suggestions — click Refresh to try again.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── CENTRE: Post details ── */}
        <div className="w-64 flex-shrink-0 border-r border-[rgba(120,140,180,0.14)] overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5 bg-app-surface">

          {/* Schedule */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-3 mb-2">Schedule</label>
            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-[10px] text-app-text-3 mb-1 flex items-center gap-1">
                  <CalendarIcon size={10} /> Date
                </label>
                <input type="date" title="Schedule date" value={date} onChange={e => setDate(e.target.value)}
                  className={`w-full text-xs border border-app-border rounded-lg px-2 py-2 bg-app-surface-2 text-app-text focus:ring-2 focus:ring-[rgba(255,140,66,0.12)] outline-none ${styles.darkSchemeInput}`} />
              </div>
              <div>
                <label className="block text-[10px] text-app-text-3 mb-1 flex items-center gap-1">
                  <Clock size={10} /> Time
                </label>
                <input type="time" title="Schedule time" value={time} onChange={e => setTime(e.target.value)}
                  className={`w-full text-xs border border-app-border rounded-lg px-2 py-2 bg-app-surface-2 text-app-text focus:ring-2 focus:ring-[rgba(255,140,66,0.12)] outline-none ${styles.darkSchemeInput}`} />
              </div>
            </div>
          </div>

          {/* Media */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-3 mb-2">Media</label>
            {selectedBackground !== 'none' ? (
              <div className="border rounded-lg p-2.5 flex items-start gap-2 text-xs bg-[rgba(255,140,66,0.08)] border-[rgba(255,140,66,0.3)] text-app-orange-2">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-app-orange" />
                <div>
                  <p className="font-semibold">Media disabled</p>
                  <p className="text-[10px] mt-0.5 opacity-80">Text-only with colored backgrounds.</p>
                </div>
              </div>
            ) : mediaFile && mediaPreviewUrl ? (
              <div className="flex flex-col gap-1.5">
                <div className={`relative rounded-xl overflow-hidden border border-app-border group ${
                  postType === 'Feed' ? 'w-full aspect-[4/5]' : 'w-36 mx-auto aspect-[9/16]'
                }`}>
                  {mediaFile.type.startsWith('video/') ? (
                    <video src={mediaPreviewUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={mediaPreviewUrl} alt="preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
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
                <p className="text-[10px] text-app-text-3 text-center truncate px-1">{mediaFile.name}</p>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className={`group border-2 border-dashed border-app-border rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[rgba(255,140,66,0.45)] transition-all ${styles.mediaDropzone}`}>
                <div className="bg-app-surface-3 p-2.5 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <ImageIcon size={18} className="text-app-orange-2" />
                </div>
                <span className="text-xs text-app-text-3">Add Photo or Video</span>
              </div>
            )}
          </div>

          {/* Facebook-specific settings */}
          {isFacebook && (
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-3 mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 bg-[#1877F2] text-white rounded flex items-center justify-center text-[9px] font-bold">f</span>
                Facebook Settings
              </label>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] text-app-text-3 mb-1 uppercase tracking-wide">Post Type</label>
                  <div className="relative">
                    <select title="Post type" value={postType}
                      onChange={e => {
                        setPostType(e.target.value as 'Feed' | 'Reel' | 'Story');
                        if (e.target.value !== 'Feed') setSelectedBackground('none');
                      }}
                      className="w-full appearance-none bg-app-surface-2 border border-app-border rounded-lg px-3 py-2 pr-7 text-xs text-app-text focus:ring-2 focus:ring-[rgba(255,140,66,0.12)] outline-none">
                      <option value="Feed">Feed Post</option>
                      <option value="Reel">Reel</option>
                      <option value="Story">Story</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-app-text-3 mb-1 uppercase tracking-wide">Who Can Comment?</label>
                  <div className="relative">
                    <select title="Who can comment" disabled className="w-full appearance-none bg-app-surface-2 border border-app-border rounded-lg px-3 py-2 pr-7 text-xs text-app-text-3 outline-none">
                      <option>Public</option>
                      <option>Followers only</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-3 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Live preview ── */}
        <div className="w-80 flex-shrink-0 overflow-y-auto custom-scrollbar p-5 bg-[rgba(13,20,36,0.4)] flex flex-col gap-4">

          {/* Preview header */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Eye size={13} className="text-app-text-3" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-app-text-3">Live Preview</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isFacebook
                  ? 'bg-[rgba(24,114,255,0.1)] border-[rgba(24,114,255,0.3)] text-[#7eb3ff]'
                  : 'bg-[rgba(225,60,100,0.1)] border-[rgba(225,60,100,0.3)] text-[#f5a0b5]'
              }`}>
                {platform}
              </span>
            </div>
            <p className="text-[10px] text-app-text-3 leading-relaxed">
              Approximate preview — actual appearance may vary slightly on {platform}.
            </p>
          </div>

          <PostPreviewCard
            platform={platform}
            postType={postType}
            content={content}
            selectedBackground={selectedBackground}
            mediaPreviewUrl={mediaPreviewUrl}
            mediaType={mediaFile?.type}
            date={date}
            time={time}
          />
        </div>

      </div>

      <input type="file" ref={fileInputRef} aria-label="Upload media"
        onChange={e => { if (e.target.files?.[0]) setMediaFile(e.target.files[0]); }}
        accept="image/*,video/*" className="hidden" />
    </div>
  );
};
