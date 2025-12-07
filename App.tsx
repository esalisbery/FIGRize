import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CalendarGrid } from './components/CalendarGrid';
import { PostModal } from './components/PostModal';
import { FacebookLoginPopup } from './components/FacebookLoginPopup';
import { Platform, SocialPost, ConnectedAccount } from './types';
import { addDays, subDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Plus, AlertCircle, Facebook, CheckCircle2 } from 'lucide-react';
import { Button } from './components/Button';

// Mock Initial Data
const INITIAL_POSTS: SocialPost[] = [
  {
    id: '1',
    content: "Excited to launch our new product line! 🚀 #LaunchDay #Tech",
    date: new Date(new Date().setHours(10, 0, 0, 0)),
    durationMinutes: 60,
    platform: Platform.Facebook,
    isDraft: false
  },
  {
    id: '2',
    content: "Behind the scenes at our annual team retreat. 🌲",
    date: new Date(new Date().setHours(14, 30, 0, 0)),
    durationMinutes: 90,
    platform: Platform.Instagram,
    mediaUrl: 'mock-image.jpg',
    isDraft: false
  },
  {
      id: '3',
      content: "Check out our latest case study on optimizing react performance.",
      date: new Date(addDays(new Date(), 1).setHours(9, 0, 0, 0)),
      durationMinutes: 60,
      platform: Platform.Facebook,
      isDraft: false
  }
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<SocialPost[]>(INITIAL_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  
  // Connection State
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [activePlatforms, setActivePlatforms] = useState<Platform[]>(Object.values(Platform));
  
  // Modal state
  const [selectedSlot, setSelectedSlot] = useState<{date: Date} | null>(null);

  const handlePrevWeek = () => setCurrentDate(subDays(currentDate, 7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(new Date());

  const handleSlotClick = (date: Date, hour: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    setSelectedSlot({ date: slotDate });
    setIsModalOpen(true);
  };

  const handleSavePost = (newPost: SocialPost) => {
    setPosts([...posts, newPost]);
  };

  const handleLoginSuccess = () => {
    setConnectedAccount({
      id: 'fb-123456',
      name: 'Tech Innovators Inc.',
      handle: '@techinnovators',
      platform: Platform.Facebook,
      avatarUrl: 'https://picsum.photos/seed/tech/200'
    });
    setIsLoginPopupOpen(false);
    // Auto-select Facebook filter
    if (!activePlatforms.includes(Platform.Facebook)) {
        setActivePlatforms([...activePlatforms, Platform.Facebook]);
    }
  };

  const handleDisconnect = () => {
      setConnectedAccount(null);
      // Optional: remove FB from filters or leave it
  };

  const togglePlatform = (p: Platform) => {
      if (activePlatforms.includes(p)) {
          if (activePlatforms.length > 1) {
              setActivePlatforms(activePlatforms.filter(plat => plat !== p));
          }
      } else {
          setActivePlatforms([...activePlatforms, p]);
      }
  };

  const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endWeek = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        connectedAccount={connectedAccount} 
        onConnectClick={() => setIsLoginPopupOpen(true)}
        onDisconnectClick={handleDisconnect}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center justify-between z-20 shadow-sm">
          
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={handleToday}>Today</Button>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button onClick={handlePrevWeek} className="p-1.5 hover:bg-white rounded-md transition-shadow text-gray-600">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleNextWeek} className="p-1.5 hover:bg-white rounded-md transition-shadow text-gray-600">
                        <ChevronRight size={16} />
                    </button>
                </div>
                <span className="text-lg font-bold text-gray-800 ml-2 whitespace-nowrap">
                    {format(startWeek, 'MMMM d')} - {format(endWeek, 'd, yyyy')}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                {Object.values(Platform).map(p => {
                    const isActive = activePlatforms.includes(p);
                    const isFB = p === Platform.Facebook;
                    return (
                        <button 
                            key={p}
                            onClick={() => togglePlatform(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                                isActive 
                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >   
                            {isFB && connectedAccount && isActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                            )}
                            {p}
                        </button>
                    );
                })}
            </div>
            
            <div className="h-6 w-px bg-gray-300"></div>

            <Button variant="primary" onClick={() => { setSelectedSlot(null); setIsModalOpen(true); }} className="shadow-lg shadow-indigo-500/20">
                <Plus size={16} className="mr-2" />
                Create Post
            </Button>
          </div>
        </header>

        {/* Filters / Sub-Header */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-6 text-gray-500 font-medium">
               <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-200"></div>
                    Best time
               </span>
               <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200"></div>
                    Standard
               </span>
            </div>
            <div className="flex items-center gap-3">
                {connectedAccount ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 size={12} /> 
                        <span className="font-semibold">Facebook Connected</span>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsLoginPopupOpen(true)}
                        className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
                    >
                        <AlertCircle size={12} /> 
                        <span className="font-semibold">Connect Page</span>
                    </button>
                )}
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                    <Download size={14} />
                    <span>Export</span>
                </button>
            </div>
        </div>

        {/* Main Calendar Area */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col relative bg-slate-50/50">
           <CalendarGrid 
              currentDate={currentDate} 
              posts={posts} 
              onSlotClick={handleSlotClick}
              onPostClick={(post) => alert(`Editing post: ${post.content}`)}
              filteredPlatforms={activePlatforms}
           />
        </main>
      </div>

      <PostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePost}
        initialDate={selectedSlot?.date}
        initialPlatform={connectedAccount ? Platform.Facebook : Platform.Facebook}
      />
      
      <FacebookLoginPopup 
        isOpen={isLoginPopupOpen} 
        onClose={() => setIsLoginPopupOpen(false)}
        onLogin={handleLoginSuccess}
      />
    </div>
  );
};

export default App;