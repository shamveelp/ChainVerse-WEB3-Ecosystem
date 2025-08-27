import React from "react";

type Props = {
  type: "native" | "token";
  tokenSymbol?: string;
  tokenBalance?: string;
  current: string;
  setValue: (value: string) => void;
  max?: string;
  value: string;
};

export default function SwapInput({
  type,
  tokenSymbol,
  tokenBalance,
  setValue,
  value,
  current,
  max,
}: Props) {
  const truncate = (value: string) => {
    if (!value) return "0.0";
    if (value.length > 5) return value.slice(0, 5);
    return value;
  };

  return (
    <div className="relative bg-gray-800 bg-opacity-50 border border-gray-600 rounded-xl p-5 mb-4 backdrop-blur-lg transition-all duration-300 hover:shadow-xl hover:border-blue-500">
      <input
        type="number"
        placeholder="0.0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={current !== type}
        className={`w-full bg-transparent text-white text-3xl font-bold placeholder-gray-400 border-none outline-none pr-24 ${
          current !== type ? "cursor-not-allowed opacity-50" : "hover:text-blue-300"
        } transition-all duration-200`}
      />
      <div className="absolute top-4 right-4 text-right">
        <p className="text-sm font-medium text-gray-200">{tokenSymbol}</p>
        <p className="text-xs text-gray-400">Balance: {truncate(tokenBalance as string)}</p>
        {current === type && (
          <button
            onClick={() => setValue(max || "0")}
            className="mt-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Max
          </button>
        )}
      </div>
    </div>
  );
}