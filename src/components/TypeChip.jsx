function TypeChip({ tone = "primary", icon: Icon, label }) {
  const tones = {
    lost: "border-lost/25 bg-lost/10 text-lost",
    found: "border-found/25 bg-found/10 text-found",
    recovered: "border-recovered/25 bg-recovered/10 text-recovered",
    neutral: "border-ink/25 bg-ink/5 text-ink",
    primary: "border-primary/25 bg-frost text-primary",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold normal-case ${tones[tone]}`}
    >
      {Icon ? <Icon size={16} /> : null}
      {label}
    </span>
  );
}

export default TypeChip;