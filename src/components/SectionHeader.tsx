interface SectionHeaderProps {
  title: string;
  count: number;
  actionText?: string;
  onAction?: () => void;
}

const SectionHeader = ({ title, count, actionText, onAction }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <h2 className="text-base font-semibold text-foreground">
        {title} ({count})
      </h2>
      {actionText && (
        <button 
          onClick={onAction}
          className="text-sm text-muted-foreground hover:opacity-80 transition-opacity"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
