import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { CalendarGrid } from './components/CalendarGrid';
import { PostComposer } from './components/PostComposer';
import { FacebookLoginPopup } from './components/FacebookLoginPopup';
import { Platform, SocialPost, ConnectedAccount, FacebookPage } from './types';
import { addDays, subDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { CLOUD_URL } from './constants';
import { ChevronLeft, ChevronRight, Download, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './components/Button';
import styles from './components/App.module.css';


type AppView = 'calendar' | 'composer';
type ConnectStatus = 'idle' | 'waiting' | 'success' | 'error';

const App: React.FC = () => {
  const [view, setView]                   = useState<AppView>('calendar');
  const [currentDate, setCurrentDate]     = useState(new Date());
  const [posts, setPosts]                 = useState<SocialPost[]>([]);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [connectedPages, setConnectedPages]     = useState<FacebookPage[]>([]);
  const [connectStatus, setConnectStatus]       = useState<ConnectStatus>('idle');
  const [connectError, setConnectError]         = useState<string | undefined>();
  const [activePlatforms, setActivePlatforms]   = useState<Platform[]>(Object.values(Platform));
  const [selectedSlot, setSelectedSlot]   = useState<Date | null>(null);
  const [editingPost, setEditingPost]     = useState<SocialPost | null>(null);

  /* ── Load scheduled posts from cloud on startup ── */
  useEffect(() => {
    fetch(`${CLOUD_URL}/posts`)
      .then(r => r.json())
      .then((cloudPosts: Array<Record<string, unknown>>) => {
        const mapped: SocialPost[] = cloudPosts.map(p => ({
          id:             p.id as string,
          content:        p.content as string,
          date:           new Date(p.scheduled_at as string),
          durationMinutes: 60,
          platform:       (p.platform as Platform) || Platform.Facebook,
          isDraft:        false,
          fbPostId:       (p.fb_post_id as string) || undefined,
          publishError:   (p.error_message as string) || undefined,
        }));
        setPosts(mapped);
      })
      .catch(() => {});
  }, []);

  /* ── Facebook OAuth IPC ── */
  const handleConnectFacebook = useCallback(() => {
    setConnectStatus('waiting');
    setConnectError(undefined);
    window.electronAPI.connectFacebook();
  }, []);

  useEffect(() => {
    const unsub = window.electronAPI.onFacebookConnected((payload) => {
      if (payload.success) {
        const pages = payload.pages;
        setConnectedPages(pages);
        // Sync page tokens to cloud so the 24/7 scheduler can post on our behalf
        fetch(`${CLOUD_URL}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages }),
        }).catch(() => {});
        // Use the first page as the primary connected account
        const primary = pages[0];
        if (primary) {
          setConnectedAccount({
            id: primary.id,
            name: primary.name,
            handle: `@${primary.name.toLowerCase().replace(/\s+/g, '')}`,
            platform: Platform.Facebook,
            avatarUrl: `https://graph.facebook.com/${primary.id}/picture?type=square`,
          });
        }
        setConnectStatus('success');
        if (!activePlatforms.includes(Platform.Facebook)) {
          setActivePlatforms(prev => [...prev, Platform.Facebook]);
        }
        // Auto-close popup after brief success display
        setTimeout(() => setIsLoginPopupOpen(false), 2000);
      } else {
        setConnectStatus('error');
        setConnectError((payload as { success: false; error: string }).error);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Navigation helpers ── */
  const openComposer = (slot?: Date, post?: SocialPost | null) => {
    setSelectedSlot(slot ?? null);
    setEditingPost(post ?? null);
    setView('composer');
  };

  const closeComposer = () => {
    setView('calendar');
    setSelectedSlot(null);
    setEditingPost(null);
  };

  /* ── Calendar handlers ── */
  const handleSlotClick = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    openComposer(d);
  };

  const handleSavePost = (savedPost: SocialPost) => {
    setPosts(prev => {
      const exists = prev.some(p => p.id === savedPost.id);
      return exists
        ? prev.map(p => p.id === savedPost.id ? savedPost : p)
        : [...prev, savedPost];
    });
  };

  const handleOpenLoginPopup = () => {
    setConnectStatus('idle');
    setConnectError(undefined);
    setIsLoginPopupOpen(true);
  };

  const handleExport = () => {
    const data = JSON.stringify(
      posts.map(p => ({ ...p, date: p.date instanceof Date ? p.date.toISOString() : p.date })),
      null, 2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figRize-posts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePlatform = (p: Platform) => {
    if (activePlatforms.includes(p)) {
      if (activePlatforms.length > 1) setActivePlatforms(activePlatforms.filter(x => x !== p));
    } else {
      setActivePlatforms([...activePlatforms, p]);
    }
  };

  /* ── Composer route ── */
  if (view === 'composer') {
    return (
      <>
        <PostComposer
          onBack={closeComposer}
          onSave={handleSavePost}
          initialDate={selectedSlot ?? undefined}
          initialPlatform={Platform.Facebook}
          editingPost={editingPost}
          connectedPages={connectedPages}
        />
        <FacebookLoginPopup
          isOpen={isLoginPopupOpen}
          onClose={() => setIsLoginPopupOpen(false)}
          onConnectClick={handleConnectFacebook}
          connectStatus={connectStatus}
          connectError={connectError}
        />
      </>
    );
  }

  /* ── Calendar route ── */
  const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endWeek   = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden font-sans text-app-text">
      <Sidebar
        connectedAccount={connectedAccount}
        onConnectClick={handleOpenLoginPopup}
        onDisconnectClick={() => {
          setConnectedAccount(null);
          setConnectedPages([]);
          setConnectStatus('idle');
        }}
        onQuickPost={() => openComposer()}
      />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Top header */}
        <header className={`px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center justify-between z-20 ${styles.glassHeader}`}>
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
              <div className="flex items-center bg-app-surface-2 rounded-lg p-0.5 border border-app-border">
                <button
                  type="button"
                  title="Previous week"
                  onClick={() => setCurrentDate(subDays(currentDate, 7))}
                  className="p-1.5 rounded-lg transition-all text-app-text-3 hover:bg-app-surface-3 hover:text-app-orange border border-app-border bg-app-surface-2"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  title="Next week"
                  onClick={() => setCurrentDate(addDays(currentDate, 7))}
                  className="p-1.5 rounded-lg transition-all text-app-text-3 hover:bg-app-surface-3 hover:text-app-orange border border-app-border bg-app-surface-2"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="text-lg font-bold text-app-text ml-2 whitespace-nowrap">
                {format(startWeek, 'MMMM d')} – {format(endWeek, 'd, yyyy')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-1 bg-app-surface-2 p-1 rounded-lg border border-app-border">
              {Object.values(Platform).map(p => {
                const isActive = activePlatforms.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[rgba(255,140,66,0.12)] text-app-orange-2 border border-[rgba(255,140,66,0.45)]'
                        : 'text-app-text-3 hover:text-app-text-2'
                    }`}
                  >
                    {p === Platform.Facebook && connectedAccount && isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 ring-2 ring-app-surface-2" />
                    )}
                    {p}
                  </button>
                );
              })}
            </div>
            <div className="h-6 w-px bg-app-border" />
            <Button variant="primary" onClick={() => openComposer()} className="shadow-lg shadow-indigo-500/20">
              <Plus size={16} className="mr-2" />
              Create Post
            </Button>
          </div>
        </header>

        {/* Sub-header */}
        <div className={`px-6 py-2.5 flex items-center justify-between text-xs ${styles.glassSubHeader}`}>
          <div className="flex items-center gap-6 text-app-text-3 font-medium">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[rgba(255,140,66,0.5)] border border-[rgba(255,140,66,0.4)]" /> Best time
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-app-surface-3 border border-app-border" /> Standard
            </span>
          </div>
          <div className="flex items-center gap-3">
            {connectedAccount ? (
              <div className="flex items-center gap-1.5 text-app-teal bg-[rgba(62,193,166,0.08)] px-2.5 py-1 rounded-full border border-[rgba(62,193,166,0.2)]">
                <CheckCircle2 size={12} />
                <span className="font-semibold">Facebook Connected</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenLoginPopup}
                className="flex items-center gap-1.5 text-app-orange-2 bg-[rgba(255,140,66,0.08)] px-2.5 py-1 rounded-full border border-[rgba(255,140,66,0.3)] hover:bg-[rgba(255,140,66,0.14)] transition-colors"
              >
                <AlertCircle size={12} />
                <span className="font-semibold">Connect Page</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 text-app-text-3 hover:text-app-text-2 px-2 py-1 rounded hover:bg-app-surface-2 transition-colors"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Calendar */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col relative bg-transparent">
          <CalendarGrid
            currentDate={currentDate}
            posts={posts}
            onSlotClick={handleSlotClick}
            onPostClick={post => openComposer(undefined, post)}
            filteredPlatforms={activePlatforms}
          />
        </main>
      </div>

      <FacebookLoginPopup
        isOpen={isLoginPopupOpen}
        onClose={() => setIsLoginPopupOpen(false)}
        onConnectClick={handleConnectFacebook}
        connectStatus={connectStatus}
        connectError={connectError}
      />
    </div>
  );
};

export default App;
