import React, { useState } from 'react';
import { X, Lock, Info, CheckCircle, ChevronRight } from 'lucide-react';

interface FacebookLoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const FacebookLoginPopup: React.FC<FacebookLoginPopupProps> = ({ isOpen, onClose, onLogin }) => {
  const [step, setStep] = useState<'login' | 'select-pages' | 'permissions'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('select-pages');
    }, 1000);
  };

  const handlePageSelect = (pageId: string) => {
      if (selectedPages.includes(pageId)) {
          setSelectedPages(selectedPages.filter(id => id !== pageId));
      } else {
          setSelectedPages([...selectedPages, pageId]);
      }
  };

  const handlePagesConfirm = () => {
      setStep('permissions');
  };

  const handleFinalConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f0f2f5] w-full max-w-[420px] rounded-xl shadow-2xl overflow-hidden font-sans border border-gray-200">
        
        {/* FB Header */}
        <div className="bg-[#1877F2] px-4 py-3 flex items-center justify-between shadow-sm">
          <h3 className="text-white font-bold text-xl tracking-tight">facebook</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-white min-h-[400px] flex flex-col">
          
          {/* STEP 1: LOGIN */}
          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="flex-1 flex flex-col p-8">
               <div className="text-center mb-8">
                 <h4 className="text-xl font-bold text-gray-900">Log Into Facebook</h4>
                 <p className="text-gray-500 text-sm mt-1">Enter your credentials to connect SocialFlow</p>
               </div>
               <div className="space-y-4 flex-1">
                 <input 
                   type="text" 
                   placeholder="Email or Phone Number" 
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877f2] focus:border-transparent outline-none text-base transition-shadow"
                   required
                 />
                 <input 
                   type="password" 
                   placeholder="Password" 
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877f2] focus:border-transparent outline-none text-base transition-shadow"
                   required
                 />
                 <button 
                   type="submit"
                   disabled={isLoading}
                   className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-lg text-base transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                 >
                   {isLoading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : 'Log In'}
                 </button>
               </div>
               <div className="mt-6 text-center">
                 <a href="#" className="text-[#1877f2] text-sm hover:underline font-medium">Forgot account?</a>
               </div>
            </form>
          )}

          {/* STEP 2: SELECT PAGES */}
          {step === 'select-pages' && (
              <div className="flex-1 flex flex-col p-6">
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Select Pages</h4>
                    <p className="text-gray-500 text-sm">Choose the Facebook Pages you want to manage.</p>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] mb-4 pr-1">
                    {[
                        { id: '1', name: 'Tech Innovators Inc.', cat: 'Business' },
                        { id: '2', name: 'Demo User Portfolio', cat: 'Personal Blog' },
                        { id: '3', name: 'Startup Weekly', cat: 'Media' }
                    ].map(page => (
                        <div 
                            key={page.id}
                            onClick={() => handlePageSelect(page.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedPages.includes(page.id) 
                                ? 'border-[#1877f2] bg-blue-50' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                selectedPages.includes(page.id) ? 'bg-[#1877f2] border-[#1877f2]' : 'border-gray-300 bg-white'
                            }`}>
                                {selectedPages.includes(page.id) && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                <img src={`https://picsum.photos/seed/${page.id}/100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{page.name}</p>
                                <p className="text-xs text-gray-500">{page.cat}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={handlePagesConfirm}
                        disabled={selectedPages.length === 0}
                        className="bg-[#1877f2] disabled:bg-gray-300 hover:bg-[#166fe5] text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
              </div>
          )}

          {/* STEP 3: PERMISSIONS */}
          {step === 'permissions' && (
            <div className="flex-1 flex flex-col p-6">
               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src="https://picsum.photos/seed/socialflow/200" alt="App Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">SocialFlow Planner</h4>
                    <p className="text-sm text-gray-500">is requesting access to:</p>
                  </div>
               </div>

               <div className="space-y-4 mb-6 flex-1">
                 <div className="flex gap-3 items-start">
                   <div className="mt-0.5 p-1 bg-blue-50 rounded-full">
                     <Info className="text-[#1877f2]" size={16} />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-800">Manage your Pages</p>
                     <p className="text-xs text-gray-500">Show a list of the Pages you manage.</p>
                   </div>
                 </div>
                 <div className="flex gap-3 items-start">
                    <div className="mt-0.5 p-1 bg-blue-50 rounded-full">
                     <Info className="text-[#1877f2]" size={16} />
                   </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Publish to Pages</p>
                      <p className="text-xs text-gray-500">Create and manage posts on your Page.</p>
                    </div>
                 </div>
               </div>

               <div className="mt-auto space-y-3">
                 <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">D</div>
                    <span className="text-xs text-gray-600">You are logged in as <span className="font-semibold text-gray-900">Demo User</span></span>
                 </div>

                 <div className="flex gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={() => setStep('select-pages')}
                     className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                   >
                     Back
                   </button>
                   <button 
                     type="button"
                     onClick={handleFinalConfirm}
                     disabled={isLoading}
                     className="flex-1 px-4 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                   >
                     {isLoading ? 'Connecting...' : 'Done'}
                   </button>
                 </div>
               </div>
               
               <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                  <Lock size={10} />
                  <span>SocialFlow cannot post without your explicit permission.</span>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};