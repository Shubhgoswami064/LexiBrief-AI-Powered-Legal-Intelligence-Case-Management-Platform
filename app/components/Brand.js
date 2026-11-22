export default function Brand({ tone = "light" }) {
  const color = tone === "light" ? "text-white" : "text-ink";
  return (
    <div className={`flex items-center gap-3 ${color}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="24" height="24" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 9.5h12M8 14h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 18.5h7" stroke="#b8862b" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="font-serif text-xl tracking-tight">LexiBrief</span>
    </div>
  );
}