interface TileProps {
  letter: string;
  state?: "correct" | "present" | "absent";
}

export function Tile({ letter, state }: TileProps) {
  const getBgColor = () => {
    if (!state) return "bg-white border-2 border-gray-300";
    if (state === "correct") return "bg-wordle-correct text-white";
    if (state === "present") return "bg-wordle-present text-white";
    return "bg-wordle-absent text-white";
  };

  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded border-2 font-bold text-lg ${getBgColor()}`}
    >
      {letter.toUpperCase()}
    </div>
  );
}
