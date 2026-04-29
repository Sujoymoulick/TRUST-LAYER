export default function PublicProfile() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-body">
      <div className="max-w-md w-full brutal-card space-y-8 text-center py-12">
        {/* Profile Pic with Trusted Badge */}
        <div className="relative inline-block">
          <div className="w-32 h-32 border-4 border-black rounded-full overflow-hidden bg-gray-100 mx-auto">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=orla" alt="avatar" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-brutal-green border-4 border-black px-4 py-1 flex items-center gap-2 whitespace-nowrap">
             <span className="text-xl">✅</span>
             <span className="font-display text-xs uppercase">Trusted User</span>
          </div>
        </div>

        <div className="pt-4">
          <h1 className="font-display text-4xl uppercase leading-none">Orla Flores</h1>
          <p className="text-xs font-bold text-gray-500 uppercase mt-2">Helpful text goes here.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 border-4 border-black bg-white">
          <div className="p-4 border-r-4 border-black">
             <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Jobs Completed</div>
             <div className="font-display text-2xl">150</div>
          </div>
          <div className="p-4 border-r-4 border-black">
             <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Average Review</div>
             <div className="font-display text-2xl">4.9/5</div>
          </div>
          <div className="p-4">
             <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Response Time</div>
             <div className="font-display text-2xl leading-none pt-1">1hr avg</div>
          </div>
        </div>

        <button className="brutal-btn bg-white w-full py-4 text-base">
          Request Review
        </button>
      </div>
      
      {/* Footer Branding */}
      <div className="mt-8 font-display text-2xl uppercase tracking-tighter">
        TrustLayer
      </div>
    </div>
  );
}
