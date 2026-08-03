interface TrustScoreProps {
  score: number;
  label: string;
}

const TrustScore = ({ score, label }: TrustScoreProps) => {
  return (
    <div className="brutal-card border-4 shadow-lg text-center flex flex-col items-center justify-center h-full">
      <h3 className="text-sm font-bold uppercase mb-6 tracking-widest text-slate-700">YOUR TRUST SCORE</h3>
      <div className="text-[5rem] font-bold leading-none mb-6">{score}</div>
      <div className="w-full max-w-[200px] h-4 border border-slate-200 dark:border-zinc-800 rounded-full overflow-hidden mb-4 bg-gray-100 relative">
        <div className="absolute top-0 left-0 h-full w-[96%] bg-brutal-green border-r border-slate-200 dark:border-zinc-800" />
      </div>
      <p className="text-xl font-bold text-brutal-green uppercase tracking-wider">{label}</p>
    </div>
  );
};

export default TrustScore;
