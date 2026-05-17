import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { VITE_API_BASE_URL } from '../lib/api';
import { 
  Clock, 
  Image as ImageIcon, 
  Send, 
  CornerDownRight, 
  ShieldAlert, 
  Plus, 
  X,
  Loader2,
  Lock,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAdminEmail } from '../lib/utils';
import { useGuest } from '../context/GuestContext';

interface Reply {
  _id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  replyText: string;
  createdAt: string;
}

interface FeedbackPost {
  _id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  screenshotUrl: string | null;
  category: 'thought' | 'issue' | 'lag' | 'delay';
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

export default function Feedback() {
  const { isGuest } = useGuest();
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form fields
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'thought' | 'issue' | 'lag' | 'delay'>('thought');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'thought' | 'issue' | 'lag' | 'delay'>('all');
  
  // Reply states indexed by post id
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAdmin(isAdminEmail(user.email));
      }
    }
    loadUserData();
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${VITE_API_BASE_URL}/feedback`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      alert('Guest mode users cannot post issues.');
      return;
    }
    if (!content.trim()) return;

    try {
      setSubmitLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const formData = new FormData();
      formData.append('content', content);
      formData.append('category', category);
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const res = await fetch(`${VITE_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setContent('');
        removeScreenshot();
        // Insert new post at top of list
        setPosts(prev => [data.data, ...prev]);
      } else {
        alert(data.error || 'Failed to submit post.');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePostReply = async (postId: string) => {
    if (!isAdmin) return;
    const replyText = replyTextMap[postId];
    if (!replyText || !replyText.trim()) return;

    try {
      setReplyLoadingMap(prev => ({ ...prev, [postId]: true }));
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${VITE_API_BASE_URL}/feedback/${postId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ replyText })
      });

      const data = await res.json();
      if (data.success) {
        // Clear input
        setReplyTextMap(prev => ({ ...prev, [postId]: '' }));
        // Update specific post with new replies
        setPosts(prev => prev.map(p => p._id === postId ? data.data : p));
      } else {
        alert(data.error || 'Failed to submit reply.');
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setReplyLoadingMap(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleReplyTextChange = (postId: string, text: string) => {
    setReplyTextMap(prev => ({ ...prev, [postId]: text }));
  };

  // Category Color Map
  const getCategoryStyles = (cat: 'thought' | 'issue' | 'lag' | 'delay') => {
    switch (cat) {
      case 'thought':
        return {
          bg: 'bg-brutal-yellow text-black',
          badge: 'bg-brutal-yellow text-black border-2 border-black',
          label: 'Thought'
        };
      case 'issue':
        return {
          bg: 'bg-brutal-pink text-white',
          badge: 'bg-brutal-pink text-white border-2 border-black',
          label: 'Bug / Issue'
        };
      case 'lag':
        return {
          bg: 'bg-[#FF5F00] text-white',
          badge: 'bg-[#FF5F00] text-white border-2 border-black',
          label: 'Lag / Stutter'
        };
      case 'delay':
        return {
          bg: 'bg-[#00E5FF] text-black',
          badge: 'bg-[#00E5FF] text-black border-2 border-black',
          label: 'Response Delay'
        };
    }
  };

  const filteredPosts = posts.filter(p => activeFilter === 'all' || p.category === activeFilter);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl uppercase tracking-tight">Feedback & Issues Hub</h2>
          <p className="font-bold text-gray-500 uppercase text-xs mt-1">
            Report lags, network delays, website issues, or share your thoughts with the developers.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-brutal-yellow text-black border-2 border-black px-4 py-2 shadow-[2px_2px_0px_#000] font-display text-xs uppercase font-black">
          <Activity className="animate-pulse size-4 shrink-0" />
          Live Community Support
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Post Form (Left 1 col or Top on small screens) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="brutal-card bg-white shadow-[6px_6px_0px_#000]">
            <h3 className="font-display text-base uppercase mb-4 flex items-center gap-2">
              <Plus className="size-5" /> Share Thoughts
            </h3>

            <form onSubmit={handleSubmitPost} className="space-y-4">
              {/* Category picker */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['thought', 'issue', 'lag', 'delay'] as const).map(cat => {
                    const styles = getCategoryStyles(cat);
                    const isActive = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider text-center border-2 border-black transition-all ${
                          isActive 
                            ? `${styles.bg} shadow-[2px_2px_0px_#000] translate-y-0` 
                            : 'bg-white text-black hover:bg-gray-50 hover:shadow-[1px_1px_0px_#000]'
                        }`}
                      >
                        {styles.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content textarea */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-2">Details</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your issue, lag experience, or share your feedback..."
                  rows={4}
                  className="brutal-input text-xs resize-none"
                  required
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-2">Upload Screenshot</label>
                
                {!screenshotPreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-black border-dashed p-4 text-center cursor-pointer bg-gray-50 hover:bg-gray-100/50 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <ImageIcon className="text-gray-400 size-6" />
                    <span className="text-[9px] font-black uppercase text-gray-600">Select Image (PNG, JPG)</span>
                  </div>
                ) : (
                  <div className="relative border-2 border-black rounded-none overflow-hidden bg-black/5 aspect-video">
                    <img src={screenshotPreview} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2 p-1 bg-black text-white hover:bg-brutal-pink transition-colors border border-white rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />
              </div>

              {/* Submit btn */}
              <button 
                type="submit" 
                disabled={submitLoading || isGuest}
                className="w-full brutal-btn bg-brutal-yellow font-display text-xs uppercase py-3.5 flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none transition-all shadow-[4px_4px_0px_#000]"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="animate-spin size-4" /> Posting...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Submit Feedback
                  </>
                )}
              </button>
              
              {isGuest && (
                <p className="text-[9px] font-bold text-brutal-pink text-center uppercase tracking-wide">
                  ⚠️ Guest mode cannot submit feedback.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Posts List (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Filter Panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black pb-4">
            <h3 className="font-display text-lg uppercase tracking-tight">Recent Activity</h3>
            
            <div className="flex flex-wrap gap-2">
              {(['all', 'thought', 'issue', 'lag', 'delay'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 font-display text-[9px] uppercase tracking-widest border-2 border-black transition-all ${
                    activeFilter === f 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'All Feed' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Loader or Posts List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin size-10 text-brutal-blue" />
              <p className="font-display text-xs uppercase tracking-widest animate-pulse">Retrieving Feed...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 border-4 border-black border-dashed text-gray-400 font-display uppercase">
              No feedback posts found in this category.
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post) => {
                  const styles = getCategoryStyles(post.category);
                  const isPostReplyOpen = isAdmin;
                  
                  return (
                    <motion.div 
                      key={post._id} 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="brutal-card bg-white shadow-[6px_6px_0px_#000] space-y-4"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-2 border-black rounded-full overflow-hidden shrink-0 shadow-[2px_2px_0px_#000]">
                            <img 
                              src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} 
                              alt="avatar" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div>
                            <h4 className="font-black text-xs uppercase text-black leading-tight">{post.userName}</h4>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5 flex items-center gap-1">
                              <Clock size={8} /> {new Date(post.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <span className={`brutal-badge !text-[8px] !px-2.5 !py-0.5 !border-2 uppercase font-black ${styles.badge}`}>
                          {styles.label}
                        </span>
                      </div>

                      {/* Post Content */}
                      <div className="text-xs font-bold text-gray-800 leading-relaxed uppercase whitespace-pre-line">
                        {post.content}
                      </div>

                      {/* Optional Screenshot */}
                      {post.screenshotUrl && (
                        <div className="border-2 border-black overflow-hidden bg-black/5 aspect-video w-full max-w-lg shadow-[2px_2px_0px_#000]">
                          <a href={post.screenshotUrl} target="_blank" rel="noopener noreferrer" title="View full screenshot">
                            <img src={post.screenshotUrl} alt="Reported problem screenshot" className="w-full h-full object-contain cursor-zoom-in hover:opacity-90 transition-opacity" />
                          </a>
                        </div>
                      )}

                      {/* Replies List */}
                      {post.replies && post.replies.length > 0 && (
                        <div className="border-t-2 border-black border-dashed pt-4 space-y-3">
                          <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                            <CornerDownRight size={10} /> Official Responses
                          </p>
                          
                          <div className="space-y-3 pl-4">
                            {post.replies.map((reply) => (
                              <div key={reply._id} className="p-3 border-2 border-black bg-gray-50 shadow-[2px_2px_0px_#000] flex gap-3">
                                <div className="w-7 h-7 border-2 border-black rounded-full overflow-hidden shrink-0 shadow-[1px_1px_0px_#000]">
                                  <img 
                                    src={reply.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId}`} 
                                    alt="Admin avatar" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-black text-[10px] uppercase text-brutal-blue flex items-center gap-1">
                                      {reply.userName} <ShieldAlert size={10} className="text-brutal-blue shrink-0" />
                                    </h5>
                                    <span className="text-[7px] font-black uppercase text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-700 uppercase mt-1 leading-relaxed">{reply.replyText}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reply Input Box (Only for Admins) */}
                      {isPostReplyOpen ? (
                        <div className="border-t-2 border-black border-dashed pt-4 flex gap-2 items-end">
                          <div className="flex-1">
                            <textarea
                              value={replyTextMap[post._id] || ''}
                              onChange={(e) => handleReplyTextChange(post._id, e.target.value)}
                              placeholder="Type official admin response..."
                              rows={1}
                              className="brutal-input !min-height-[36px] py-1 px-3 text-[10px] resize-none uppercase"
                            />
                          </div>
                          <button
                            onClick={() => handlePostReply(post._id)}
                            disabled={replyLoadingMap[post._id]}
                            className="p-2 border-2 border-black bg-brutal-blue hover:bg-black text-white hover:text-brutal-blue transition-colors flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:shadow-none"
                            title="Post Reply"
                          >
                            {replyLoadingMap[post._id] ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                          </button>
                        </div>
                      ) : (
                        // Standard User footer view
                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-gray-400">
                          <span className="flex items-center gap-1">
                            <Lock size={9} /> Official Reply Only
                          </span>
                          <span>{post.replies?.length || 0} Replies</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
