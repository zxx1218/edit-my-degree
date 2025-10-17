const ExamBanner = () => {
  return (
    <div className="mx-4 mt-4 mb-6 bg-gradient-to-r from-[#5DADE2] to-[#85C1E9] rounded-2xl p-6 relative overflow-hidden shadow-md">
      <div className="relative z-10">
        <h2 className="text-white text-xl font-bold mb-2">考证现状</h2>
        <p className="text-white/90 text-sm leading-relaxed">
          参与考证需求调研，分享备考经验，共筑<br />高效考证指南
        </p>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
        <div className="w-24 h-24 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
};

export default ExamBanner;
