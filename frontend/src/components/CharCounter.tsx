interface CharCounterProps {
  current: number;
  max: number;
}

export default function CharCounter({ current, max }: CharCounterProps) {
  const isOver = current >= max;
  return (
    <span className={isOver ? "text-red-500 text-xs font-medium" : "text-slate-400 dark:text-zinc-500 text-xs"}>
      {current}/{max}
    </span>
  );
}
