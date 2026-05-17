import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import type { Recorrencia } from "@/hooks/useRecorrencias";

type RecurrenceData = Omit<Recorrencia, "id" | "created_at" | "tarefa_modelo_id">;

const DIAS_SEMANA = [
  { value: 0, label: "D", full: "Domingo" },
  { value: 1, label: "S", full: "Segunda" },
  { value: 2, label: "T", full: "Terça" },
  { value: 3, label: "Q", full: "Quarta" },
  { value: 4, label: "Q", full: "Quinta" },
  { value: 5, label: "S", full: "Sexta" },
  { value: 6, label: "S", full: "Sábado" },
];

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TIPO_LABELS: Record<string, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
  anual: "Anual",
};

const defaultData: RecurrenceData = {
  tipo_recorrencia: "diaria",
  quantidade_intervalo: 1,
  hora_execucao: "09:00",
  dia_semana: [],
  dia_mes: 1,
  mes_ano: 1,
  somente_dia_util: false,
  data_inicio: new Date().toISOString().split("T")[0],
  data_fim: null,
  ativo: true,
};

export function recurrenceLabel(tipo: string | null): string | null {
  if (!tipo) return null;
  return TIPO_LABELS[tipo] || tipo;
}

interface RecurrencePanelProps {
  value: RecurrenceData | null;
  onChange: (data: RecurrenceData | null) => void;
}

export default function RecurrencePanel({ value, onChange }: RecurrencePanelProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [data, setData] = useState<RecurrenceData>(value || defaultData);

  useEffect(() => {
    if (value) {
      setEnabled(true);
      setData(value);
    } else {
      setEnabled(false);
    }
  }, [value]);

  const update = (patch: Partial<RecurrenceData>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange(next);
  };

  const toggle = () => {
    if (enabled) {
      setEnabled(false);
      onChange(null);
    } else {
      setEnabled(true);
      onChange(data);
    }
  };

  const toggleDiaSemana = (dia: number) => {
    const current = data.dia_semana || [];
    const next = current.includes(dia)
      ? current.filter((d) => d !== dia)
      : [...current, dia].sort();
    update({ dia_semana: next });
  };

  const selectStyle = "w-full bg-muted/60 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow";
  const inputStyle = selectStyle;
  const labelStyle = "text-muted-foreground/70 text-[11px] font-medium block mb-1";

  return (
    <div className="space-y-2">
      {/* Toggle */}
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all ${
          enabled
            ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-muted/60 text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
        }`}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {enabled ? `🔁 ${TIPO_LABELS[data.tipo_recorrencia]}` : "Repetir?"}
        {enabled && (
          <X
            className="h-3 w-3 ml-1 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); toggle(); }}
          />
        )}
      </button>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-3">
              {/* Tipo */}
              <div className="flex gap-1">
                {(["diaria", "semanal", "mensal", "anual"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => update({ tipo_recorrencia: tipo })}
                    className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all ${
                      data.tipo_recorrencia === tipo
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {TIPO_LABELS[tipo]}
                  </button>
                ))}
              </div>

              {/* Intervalo */}
              <div className="flex items-center gap-2">
                <span className={labelStyle}>A cada</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={data.quantidade_intervalo}
                  onChange={(e) => update({ quantidade_intervalo: Math.max(1, parseInt(e.target.value) || 1) })}
                  className={`${inputStyle} w-16 text-center`}
                />
                <span className="text-xs text-muted-foreground">
                  {data.tipo_recorrencia === "diaria" && (data.quantidade_intervalo === 1 ? "dia" : "dias")}
                  {data.tipo_recorrencia === "semanal" && (data.quantidade_intervalo === 1 ? "semana" : "semanas")}
                  {data.tipo_recorrencia === "mensal" && (data.quantidade_intervalo === 1 ? "mês" : "meses")}
                  {data.tipo_recorrencia === "anual" && (data.quantidade_intervalo === 1 ? "ano" : "anos")}
                </span>
              </div>

              {/* Hora */}
              <div>
                <label className={labelStyle}>Hora</label>
                <input
                  type="time"
                  value={data.hora_execucao || "09:00"}
                  onChange={(e) => update({ hora_execucao: e.target.value || null })}
                  className={`${inputStyle} w-28`}
                />
              </div>

              {/* Somente dias úteis / próximo dia útil */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.somente_dia_util}
                  onChange={(e) => update({ somente_dia_util: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-ring h-3.5 w-3.5"
                />
                <span className="text-xs text-muted-foreground">
                  {data.tipo_recorrencia === "diaria"
                    ? "Somente dias úteis"
                    : "Mover para próximo dia útil se cair em fim de semana"}
                </span>
              </label>

              {/* Semanal: dias da semana */}
              {data.tipo_recorrencia === "semanal" && (
                <div>
                  <label className={labelStyle}>Dias da semana</label>
                  <div className="flex gap-1">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => toggleDiaSemana(dia.value)}
                        title={dia.full}
                        className={`h-8 w-8 rounded-full text-[11px] font-medium transition-all ${
                          (data.dia_semana || []).includes(dia.value)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensal: dia do mês */}
              {data.tipo_recorrencia === "mensal" && (
                <div>
                  <label className={labelStyle}>Dia do mês</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={data.dia_mes || 1}
                    onChange={(e) => update({ dia_mes: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className={`${inputStyle} w-20`}
                  />
                </div>
              )}

              {/* Anual: dia e mês */}
              {data.tipo_recorrencia === "anual" && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className={labelStyle}>Dia</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={data.dia_mes || 1}
                      onChange={(e) => update({ dia_mes: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
                      className={`${inputStyle} w-full`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelStyle}>Mês</label>
                    <select
                      value={data.mes_ano || 1}
                      onChange={(e) => update({ mes_ano: parseInt(e.target.value) })}
                      className={selectStyle}
                    >
                      {MESES.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Data início / fim */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelStyle}>Início</label>
                  <input
                    type="date"
                    value={data.data_inicio}
                    onChange={(e) => update({ data_inicio: e.target.value })}
                    className={`${inputStyle} w-full`}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelStyle}>Fim (opcional)</label>
                  <input
                    type="date"
                    value={data.data_fim || ""}
                    onChange={(e) => update({ data_fim: e.target.value || null })}
                    className={`${inputStyle} w-full`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
