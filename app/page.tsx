"use client";

import { useEffect, useState } from "react";

type Calculation = {
  id: number;
  expression: string;
  result: number;
  createdAt: string;
};

const BUTTONS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

export default function Home() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [waitingOperand, setWaitingOperand] = useState(false);
  const [history, setHistory] = useState<Calculation[]>([]);
  const [deleting, setDeleting] = useState<Set<number>>(new Set());
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const res = await fetch("/api/calculations");
    if (res.ok) setHistory(await res.json());
  }

  async function deleteCalculation(id: number) {
    setDeleting((prev) => new Set(prev).add(id));
    await fetch(`/api/calculations/${id}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((c) => c.id !== id));
    setDeleting((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  async function saveCalculation(expr: string, result: number) {
    await fetch("/api/calculations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression: expr, result }),
    });
    fetchHistory();
  }

  function handleDigit(digit: string) {
    if (waitingOperand) {
      setDisplay(digit);
      setWaitingOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  }

  function handleDecimal() {
    if (waitingOperand) {
      setDisplay("0.");
      setWaitingOperand(false);
      return;
    }
    if (!display.includes(".")) setDisplay(display + ".");
  }

  function handleOperator(op: string) {
    const opMap: Record<string, string> = { "÷": "/", "×": "*", "−": "-", "+": "+" };
    const jsOp = opMap[op] ?? op;
    setExpression(display + jsOp);
    setWaitingOperand(true);
  }

  function handleEquals() {
    if (!expression) return;
    try {
      const jsExpr = expression + display;
      const result = Function(`"use strict"; return (${jsExpr})`)();
      const rounded = parseFloat(result.toFixed(10));
      const prettyExpr = expression
        .replace(/\//g, "÷")
        .replace(/\*/g, "×")
        .replace(/(?<!\d)-/g, "−");
      setDisplay(String(rounded));
      setExpression("");
      setWaitingOperand(true);
      saveCalculation(prettyExpr + display + " =", rounded);
    } catch {
      setDisplay("Erro");
      setExpression("");
    }
  }

  function handleClear() {
    setDisplay("0");
    setExpression("");
    setWaitingOperand(false);
  }

  function handleToggleSign() {
    setDisplay(String(parseFloat(display) * -1));
  }

  function handlePercent() {
    setDisplay(String(parseFloat(display) / 100));
  }

  function handleButton(label: string) {
    if ("0123456789".includes(label)) return handleDigit(label);
    if (label === ".") return handleDecimal();
    if (label === "=") return handleEquals();
    if (label === "C") return handleClear();
    if (label === "±") return handleToggleSign();
    if (label === "%") return handlePercent();
    handleOperator(label);
  }

  function isOperator(label: string) {
    return ["÷", "×", "−", "+"].includes(label);
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-start justify-center gap-8 p-8 pt-16 flex-wrap">
      {/* Calculator */}
      <div className="bg-black rounded-3xl p-4 w-72 shadow-2xl">
        {/* Expression line */}
        <div className="text-gray-400 text-right text-sm h-5 px-2 mb-1 truncate">
          {expression.replace(/\//g, "÷").replace(/\*/g, "×")}
        </div>
        {/* Display */}
        <div className="text-white text-right text-5xl font-light px-2 pb-4 truncate">
          {display}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {BUTTONS.flat().map((label, i) => {
            const isZero = label === "0";
            const isTop = ["C", "±", "%"].includes(label);

            return (
              <button
                key={i}
                onClick={() => handleButton(label)}
                className={[
                  "rounded-full h-16 text-xl font-medium transition-opacity active:opacity-70 cursor-pointer",
                  isZero ? "col-span-2 text-left pl-7" : "",
                  label === "=" || isOperator(label)
                    ? "bg-orange-400 text-white"
                    : isTop
                    ? "bg-gray-400 text-black"
                    : "bg-gray-700 text-white",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="bg-gray-800 rounded-2xl p-5 w-72 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">Histórico</h2>
          {history.length > 0 && (
            <button
              disabled={clearingAll}
              onClick={async () => {
                setClearingAll(true);
                await Promise.all(history.map((c) => fetch(`/api/calculations/${c.id}`, { method: "DELETE" })));
                setHistory([]);
                setClearingAll(false);
              }}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {clearingAll && <Spinner />}
              Limpar tudo
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum cálculo ainda.</p>
        ) : (
          <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {history.map((c) => (
              <li key={c.id} className="bg-gray-700 rounded-lg px-3 py-2 flex items-start justify-between gap-2 group">
                <div>
                  <p className="text-gray-300 text-sm">{c.expression}</p>
                  <p className="text-white text-lg font-medium">{c.result}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(c.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <button
                  onClick={() => deleteCalculation(c.id)}
                  disabled={deleting.has(c.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors mt-1 cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-100 disabled:cursor-not-allowed"
                  aria-label="Apagar"
                >
                  {deleting.has(c.id) ? <Spinner /> : "✕"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
