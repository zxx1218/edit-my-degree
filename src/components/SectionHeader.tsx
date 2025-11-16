interface SectionHeaderProps {
  title: string;
  count: number;
  promptText?: string;
  actionText?: string;
  onAction?: () => void;
}

const SectionHeader = ({ title, count, promptText, actionText, onAction }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <h2 className="text-lg text-foreground font-yahei">
        {title} ({count})
      </h2>
      {(promptText || actionText) && (
        <div className="flex items-center gap-1 text-sm">
          {promptText && (
            <span className="text-[#999999]">{promptText}</span>
          )}
          {actionText && (
            <button 
              onClick={onAction}
              className="text-[#25b887] hover:opacity-80 transition-opacity"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
