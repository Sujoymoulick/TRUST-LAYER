interface TrustScoreProps {
  score: number;
  label: string;
}

const TrustScore = ({ score, label }: TrustScoreProps) => {
  return (
    <div className="brutal-card border-4 shadow-[8px_8px_0px_#000] text-center flex flex-col items-center justify-center h-full">
      <h3 className="text-sm font-black uppercase mb-6 tracking-widest text-slate-700">YOUR TRUST SCORE</h3>
      <div className="text-[5rem] font-black leading-none mb-6">{score}</div>
      <div className="w-full max-w-[200px] h-4 border-2 border-black rounded-full overflow-hidden mb-4 bg-gray-100 relative">
        <div className="absolute top-0 left-0 h-full w-[96%] bg-brutal-green border-r-2 border-black" />
      </div>
      <p className="text-xl font-black text-brutal-green uppercase tracking-wider">{label}</p>
    </div>
  );
};

export default TrustScore;
