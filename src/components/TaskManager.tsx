import { useState, useCallback, useRef, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Plus,
  Check,
  Trash2,
  ChevronRight,
  Calendar,
  User,
  X,
  Menu,
  CheckSquare,
  Users,
  ListTodo,
  Filter,
  MoreVertical,
  Star,
} from "lucide-react";
import { useListas, useCreateLista, useDeleteLista, useReorderListas, useUpdateLista, WAHA_SESSIONS } from "@/hooks/useListas";
import { useAllTarefas, useCreateTarefa, useUpdateTarefa, useDeleteTarefa, useReorderTarefas, useDeletedTarefas, useRestoreTarefa, type Tarefa } from "@/hooks/useTarefas";
import { useSubtarefas, useCreateSubtarefa, useUpdateSubtarefa, useDeleteSubtarefa } from "@/hooks/useSubtarefas";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { useAllRecorrencias, useRecorrenciaByTarefa, useCreateRecorrencia, useUpdateRecorrencia, useDeleteRecorrencia, type Recorrencia } from "@/hooks/useRecorrencias";
import { useAtualizacoes, useCreateAtualizacao, useDeleteAtualizacao } from "@/hooks/useAtualizacoes";
import RecurrencePanel, { recurrenceLabel } from "@/components/RecurrencePanel";
import { Constants } from "@/integrations/supabase/types";
import ListaPermissoesModal from "@/components/ListaPermissoesModal";
import AdminPanel from "@/components/AdminPanel";
import ResponsaveisModal from "@/components/ResponsaveisModal";
import { useCurrentUser, useListaOwner } from "@/hooks/useListaPermissoes";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Share2, LogOut, ShieldCheck, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STATUS_OPTIONS = Constants.public.Enums.status_type;
const PRIORITY_OPTIONS = Constants.public.Enums.priority_level;

/* ─── Compute next due date from recurrence ─── */
function getNextRecurrenceDate(rec: Recorrencia): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(rec.data_inicio + "T00:00:00");
  start.setHours(0, 0, 0, 0);
  const base = start > today ? start : today;

  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
  const nextBusinessDay = (d: Date) => {
    const r = new Date(d);
    while (isWeekend(r)) r.setDate(r.getDate() + 1);
    return r;
  };

  if (rec.tipo_recorrencia === "diaria") {
    if (rec.somente_dia_util) {
      const candidate = nextBusinessDay(base);
      return format(candidate, "yyyy-MM-dd");
    }
    const candidate = new Date(start);
    while (candidate < today) {
      candidate.setDate(candidate.getDate() + rec.quantidade_intervalo);
    }
    return format(candidate, "yyyy-MM-dd");
  }

  if (rec.tipo_recorrencia === "semanal") {
    const dias = rec.dia_semana || [];
    if (dias.length === 0) return format(base, "yyyy-MM-dd");
    const sorted = [...dias].sort((a, b) => a - b);
    for (let offset = 0; offset < 14; offset++) {
      const candidate = new Date(base);
      candidate.setDate(base.getDate() + offset);
      if (sorted.includes(candidate.getDay())) {
        const result = rec.somente_dia_util ? nextBusinessDay(candidate) : candidate;
        return format(result, "yyyy-MM-dd");
      }
    }
    return format(base, "yyyy-MM-dd");
  }

  if (rec.tipo_recorrencia === "mensal") {
    const dia = rec.dia_mes || 1;
    const candidate = new Date(base.getFullYear(), base.getMonth(), dia);
    if (candidate < today) {
      candidate.setMonth(candidate.getMonth() + rec.quantidade_intervalo);
    }
    const result = rec.somente_dia_util ? nextBusinessDay(candidate) : candidate;
    return format(result, "yyyy-MM-dd");
  }

  if (rec.tipo_recorrencia === "anual") {
    const dia = rec.dia_mes || 1;
    const mes = (rec.mes_ano || 1) - 1;
    const candidate = new Date(base.getFullYear(), mes, dia);
    if (candidate < today) {
      candidate.setFullYear(candidate.getFullYear() + rec.quantidade_intervalo);
    }
    const result = rec.somente_dia_util ? nextBusinessDay(candidate) : candidate;
    return format(result, "yyyy-MM-dd");
  }

  return null;
}

/* ─── Relative date formatting ─── */
function formatRelativeDate(dateStr: string): { text: string; isOverdue: boolean; isToday: boolean } {
  const dueDate = new Date(dateStr);
  const dueDateDay = new Date(dueDate); dueDateDay.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - dueDateDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = dueDate < new Date() && diffDays >= 0;
  const isToday = diffDays === 0;

  // Show time suffix if not midnight
  const hasTime = dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0;
  const timeSuffix = hasTime ? ` ${dueDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "";

  if (isToday) return { text: `Hoje${timeSuffix}`, isOverdue: isOverdue, isToday: true };
  if (diffDays === 1) return { text: `1 dia atrás${timeSuffix}`, isOverdue: true, isToday: false };
  if (diffDays === -1) return { text: `Amanhã${timeSuffix}`, isOverdue: false, isToday: false };
  if (diffDays > 1 && diffDays < 7) return { text: `${diffDays} dias atrás${timeSuffix}`, isOverdue: true, isToday: false };
  if (diffDays >= 7 && diffDays < 14) return { text: `1 semana atrás${timeSuffix}`, isOverdue: true, isToday: false };
  if (diffDays >= 14 && diffDays < 30) return { text: `${Math.floor(diffDays / 7)} semanas atrás${timeSuffix}`, isOverdue: true, isToday: false };
  if (diffDays >= 30) return { text: `${Math.floor(diffDays / 30)} mês(es) atrás${timeSuffix}`, isOverdue: true, isToday: false };
  if (diffDays < -1 && diffDays > -7) return { text: `em ${Math.abs(diffDays)} dias${timeSuffix}`, isOverdue: false, isToday: false };
  if (diffDays <= -7) return { text: dueDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) + timeSuffix, isOverdue: false, isToday: false };

  return { text: dueDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) + timeSuffix, isOverdue: false, isToday: false };
}

/* ─── Debounced Input ─── */
function DebouncedInput({
  value: initialValue,
  onCommit,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setValue(initialValue); }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onCommit(e.target.value);
    }, 600);
  };

  const handleBlur = () => {
    clearTimeout(timeoutRef.current);
    if (value !== initialValue) onCommit(value);
  };

  return <input {...props} value={value} onChange={handleChange} onBlur={handleBlur} />;
}

/* ─── Recurrence Badge (uses pre-fetched map) ─── */
function RecurrenceBadge({ recorrencia }: { recorrencia: Recorrencia | undefined }) {
  if (!recorrencia) return null;
  return (
    <span className="text-primary ml-1" title={`Recorrente: ${recurrenceLabel(recorrencia.tipo_recorrencia)}`}>
      🔁
    </span>
  );
}

/* ─── Due Date Badge (Google Tasks style) ─── */
function DueDateBadge({ dateStr, isDone }: { dateStr: string; isDone: boolean }) {
  const { text, isOverdue } = formatRelativeDate(dateStr);
  const overdue = isOverdue && !isDone;
  return (
    <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
      <Calendar className={`h-3.5 w-3.5 ${overdue ? "text-destructive" : "text-muted-foreground"}`} />
      {text}
      {overdue && <span className="text-destructive">⬆</span>}
    </span>
  );
}

/* ─── Subtask List ─── */
function SubtaskList({ tarefaId, responsaveis }: { tarefaId: string; responsaveis: { id: string; nome: string }[] }) {
  const { data: subtarefas = [] } = useSubtarefas(tarefaId);
  const createSub = useCreateSubtarefa();
  const updateSub = useUpdateSubtarefa();
  const deleteSub = useDeleteSubtarefa();
  const [input, setInput] = useState("");
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const addSub = () => {
    const titulo = input.trim();
    if (!titulo) return;
    createSub.mutate({ tarefa_id: tarefaId, titulo, status: "pendente" });
    setInput("");
  };

  return (
    <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-border pl-3">
      {subtarefas.map((sub) => (
        <div key={sub.id} className="group/sub">
          <div className="flex items-center gap-2 py-0.5">
            <button
              onClick={() =>
                updateSub.mutate({
                  id: sub.id,
                  status: sub.status === "concluído" ? "pendente" : "concluído",
                })
              }
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                sub.status === "concluído"
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              {sub.status === "concluído" && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </button>
            <span
              onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
              className={`flex-1 text-sm cursor-pointer ${sub.status === "concluído" ? "line-through text-muted-foreground/60" : "text-foreground"}`}
            >
              {sub.titulo}
            </span>
            {sub.responsavel && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                {sub.responsavel}
              </span>
            )}
            <button
              onClick={() => deleteSub.mutate(sub.id)}
              className="opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {/* Responsável inline editor */}
          {expandedSub === sub.id && (
            <div className="ml-6 pb-1">
              <select
                value={sub.responsavel ?? ""}
                onChange={(e) => updateSub.mutate({ id: sub.id, responsavel: e.target.value || null })}
                className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Sem responsável</option>
                {responsaveis.map((r) => (
                  <option key={r.id} value={r.nome}>{r.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); addSub(); }} className="flex items-center gap-2">
        <Plus className="h-3 w-3 text-muted-foreground/50" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Adicionar subtarefa…"
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none py-0.5"
        />
      </form>
    </div>
  );
}

/* ─── Task Recurrence Editor ─── */
function TaskRecurrenceEditor({ task }: { task: Tarefa }) {
  const { data: recorrencia, isLoading } = useRecorrenciaByTarefa(task.id);
  const createRec = useCreateRecorrencia();
  const updateRec = useUpdateRecorrencia();
  const deleteRec = useDeleteRecorrencia();

  if (isLoading) return null;

  const handleChange = (data: any | null) => {
    if (data === null && recorrencia) {
      deleteRec.mutate(recorrencia.id);
    } else if (data && recorrencia) {
      updateRec.mutate({ id: recorrencia.id, ...data });
    } else if (data && !recorrencia) {
      createRec.mutate({ tarefa_modelo_id: task.id, ...data });
    }
  };

  const value = recorrencia
    ? {
        tipo_recorrencia: recorrencia.tipo_recorrencia,
        quantidade_intervalo: recorrencia.quantidade_intervalo,
        hora_execucao: recorrencia.hora_execucao,
        dia_semana: recorrencia.dia_semana || [],
        dia_mes: recorrencia.dia_mes,
        mes_ano: recorrencia.mes_ano,
        somente_dia_util: recorrencia.somente_dia_util,
        data_inicio: recorrencia.data_inicio,
        data_fim: recorrencia.data_fim,
        ativo: recorrencia.ativo,
      }
    : null;

  return <RecurrencePanel value={value} onChange={handleChange} />;
}

/* ─── Task Updates Timeline ─── */
function TaskUpdates({ tarefaId }: { tarefaId: string }) {
  const { data: atualizacoes = [] } = useAtualizacoes(tarefaId);
  const createAtualizacao = useCreateAtualizacao();
  const deleteAtualizacao = useDeleteAtualizacao();
  const [desc, setDesc] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  const addUpdate = () => {
    const descricao = desc.trim();
    if (!descricao) return;
    createAtualizacao.mutate({ tarefa_id: tarefaId, descricao, data_registro: data + "T00:00:00" });
    setDesc("");
    setData(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="mt-2">
      <label className="text-muted-foreground text-[11px] font-medium block mb-1.5">Atualizações</label>
      {/* Add form */}
      <form onSubmit={(e) => { e.preventDefault(); addUpdate(); }} className="flex items-end gap-2 mb-2">
        <div className="flex-1">
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descrever atualização…"
            className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-[120px]"
        />
        <button
          type="submit"
          disabled={!desc.trim()}
          className="text-primary disabled:opacity-30 p-1.5 rounded-md hover:bg-primary/10 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </form>
      {/* Timeline */}
      {atualizacoes.length > 0 && (
        <div className="border-l-2 border-primary/20 ml-1 space-y-0">
          {atualizacoes.map((at) => (
            <div key={at.id} className="relative pl-4 pb-2.5 group/upd">
              <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-primary/40" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-foreground leading-snug">{at.descricao}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(at.data_registro).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={() => deleteAtualizacao.mutate({ id: at.id, tarefaId })}
                  className="opacity-0 group-hover/upd:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5 shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Task Item (Google Tasks style) ─── */
const TaskItem = memo(function TaskItem({
  task,
  responsaveis,
  recorrencia,
  dragHandleProps,
  onUpdate,
  onDelete,
}: {
  task: Tarefa;
  responsaveis: { id: string; nome: string }[];
  recorrencia: Recorrencia | undefined;
  dragHandleProps?: any;
  onUpdate: (data: Partial<Tarefa> & { id: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isDone = task.status === "concluído";
  const isTemplate = !!recorrencia; // task is a recurrence template

  const toggleDone = () => {
    if (isTemplate && !isDone) {
      // Template tasks can't be concluded via checkbox — only via edit
      return;
    }
    onUpdate({ id: task.id, status: isDone ? "pendente" : "concluído" });
  };

  const commitField = useCallback((field: string, value: string | null) => {
    onUpdate({ id: task.id, [field]: value } as any);
  }, [task.id, onUpdate]);

  return (
    <div className="group border-b border-border/40 last:border-b-0">
      <div
        className={`flex items-start gap-3 py-2.5 px-3 transition-colors hover:bg-muted/30 cursor-pointer ${expanded ? "bg-muted/20" : ""}`}
        {...dragHandleProps}
      >
        {/* Circle checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleDone(); }}
          title={isTemplate && !isDone ? "Tarefa recorrente: conclua apenas ocorrências individuais ou edite para encerrar" : undefined}
          className={`flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            isDone
              ? "border-primary bg-primary"
              : isTemplate
                ? "border-muted-foreground/20 cursor-not-allowed opacity-50"
                : "border-muted-foreground/30 hover:border-primary"
          }`}
        >
          {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-1">
            <span className={`text-sm leading-snug ${isDone ? "line-through text-muted-foreground/50" : "text-foreground"}`}>
              {task.titulo}
            </span>
            <RecurrenceBadge recorrencia={recorrencia} />
          </div>

          {/* Description preview */}
          {task.descricao && !expanded && (
            <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{task.descricao}</p>
          )}

          {/* Due date */}
          {task.data_vencimento && (
            <DueDateBadge dateStr={task.data_vencimento} isDone={isDone} />
          )}
          {!task.data_vencimento && recorrencia && (() => {
            const nextDate = getNextRecurrenceDate(recorrencia);
            return nextDate ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] text-muted-foreground/60 italic">Próx:</span>
                <DueDateBadge dateStr={nextDate} isDone={isDone} />
              </div>
            ) : null;
          })()}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">
              {isTemplate && (
                <p className="text-xs text-muted-foreground/60 italic ml-8 mt-1 mb-2">
                  🔁 Esta é uma tarefa recorrente. As ocorrências são geradas automaticamente com base na configuração de recorrência abaixo.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ml-8">
                <div>
                  <label className="text-muted-foreground text-[11px] font-medium block mb-1">Status</label>
                  <select
                    value={task.status || "pendente"}
                    onChange={(e) => onUpdate({ id: task.id, status: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="concluído">Concluído</option>
                    {(STATUS_OPTIONS as readonly string[]).filter((s) => s !== "pendente" && s !== "concluído").map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-[11px] font-medium block mb-1">Prioridade</label>
                  <select
                    value={task.prioridade || ""}
                    onChange={(e) => onUpdate({ id: task.id, prioridade: e.target.value || null })}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Nenhuma</option>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn("text-[11px] font-medium block mb-1", task.lembrete_em && !task.responsavel ? "text-destructive" : "text-muted-foreground")}>
                    Responsável{task.lembrete_em && !task.responsavel && " *"}
                  </label>
                  <select
                    value={task.responsavel || ""}
                    onChange={(e) => onUpdate({ id: task.id, responsavel: e.target.value || null })}
                    className={cn("w-full bg-background border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring", task.lembrete_em && !task.responsavel ? "border-destructive ring-1 ring-destructive" : "border-border")}
                  >
                    <option value="">Nenhum</option>
                    {responsaveis.map((r) => (
                      <option key={r.id} value={r.nome}>{r.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-muted-foreground text-[11px] font-medium block mb-1">Data e hora de vencimento</label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn("flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-xs text-left flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-ring", !task.data_vencimento && "text-muted-foreground")}>
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {task.data_vencimento ? format(new Date(new Date(task.data_vencimento).getTime() - 3*60*60*1000), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={task.data_vencimento ? new Date(new Date(task.data_vencimento).getTime() - 3*60*60*1000) : undefined}
                          onSelect={(date) => {
                            if (!date) { onUpdate({ id: task.id, data_vencimento: null }); return; }
                            const horaAtual = task.data_vencimento ? (() => { const d = new Date(new Date(task.data_vencimento).getTime() - 3*60*60*1000); return d.toISOString().slice(11,16); })() : "00:00";
                            const dateStr = format(date, "yyyy-MM-dd");
                            onUpdate({ id: task.id, data_vencimento: new Date(dateStr + "T" + horaAtual + ":00-03:00").toISOString() });
                          }}
                          initialFocus locale={ptBR} className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="time"
                      value={task.data_vencimento ? (() => { const d = new Date(new Date(task.data_vencimento).getTime() - 3*60*60*1000); return d.toISOString().slice(11,16); })() : ""}
                      onChange={(e) => {
                        if (!task.data_vencimento || !e.target.value) return;
                        const dataStr = format(new Date(new Date(task.data_vencimento).getTime() - 3*60*60*1000), "yyyy-MM-dd");
                        onUpdate({ id: task.id, data_vencimento: new Date(dataStr + "T" + e.target.value + ":00-03:00").toISOString() });
                      }}
                      disabled={!task.data_vencimento}
                      placeholder="HH:MM"
                      className="w-[80px] bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
                    />
                    {task.data_vencimento && (
                      <button onClick={() => onUpdate({ id: task.id, data_vencimento: null })} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-muted-foreground text-[11px] font-medium block mb-1">⏰ Lembrete</label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          title={!task.responsavel ? "Defina um responsável antes de configurar o lembrete" : undefined}
                          disabled={!task.responsavel}
                          className={cn("flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-xs text-left flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-ring", !task.lembrete_em && "text-muted-foreground", !task.responsavel && "opacity-40 cursor-not-allowed")}>
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {task.lembrete_em ? format(new Date(new Date(task.lembrete_em).getTime() - 3*60*60*1000), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={task.lembrete_em ? new Date(new Date(task.lembrete_em).getTime() - 3*60*60*1000) : undefined}
                          onSelect={(date) => {
                            if (!date) { onUpdate({ id: task.id, lembrete_em: null, lembrete_enviado_em: null }); return; }
                            const horaAtual = task.lembrete_em ? (() => { const d = new Date(new Date(task.lembrete_em).getTime() - 3*60*60*1000); return d.toISOString().slice(11,16); })() : "08:00";
                            const dateStr = format(date, "yyyy-MM-dd");
                            onUpdate({ id: task.id, lembrete_em: new Date(dateStr + "T" + horaAtual + ":00-03:00").toISOString(), lembrete_enviado_em: null });
                          }}
                          initialFocus locale={ptBR} className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="time"
                      value={task.lembrete_em ? (() => { const d = new Date(new Date(task.lembrete_em).getTime() - 3*60*60*1000); return d.toISOString().slice(11,16); })() : ""}
                      onChange={(e) => {
                        if (!task.lembrete_em || !e.target.value) return;
                        const dataStr = format(new Date(new Date(task.lembrete_em).getTime() - 3*60*60*1000), "yyyy-MM-dd");
                        onUpdate({ id: task.id, lembrete_em: new Date(dataStr + "T" + e.target.value + ":00-03:00").toISOString(), lembrete_enviado_em: null });
                      }}
                      disabled={!task.lembrete_em}
                      placeholder="HH:MM"
                      className="w-[80px] bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
                    />
                    {task.lembrete_em && (
                      <button onClick={() => onUpdate({ id: task.id, lembrete_em: null, lembrete_enviado_em: null })} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-muted-foreground text-[11px] font-medium block mb-1">Descrição</label>
                  <DebouncedInput
                    value={task.descricao || ""}
                    onCommit={(v) => commitField("descricao", v || null)}
                    placeholder="Adicionar descrição…"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="sm:col-span-2">
                  <TaskRecurrenceEditor task={task} />
                </div>
                <div className="sm:col-span-2">
                  <TaskUpdates tarefaId={task.id} />
                </div>
              </div>
              <SubtaskList tarefaId={task.id} responsaveis={responsaveis} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ─── Infinite Scroll Sentinel ─── */
function InfiniteScrollSentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onVisibleRef.current(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full py-2 flex items-center justify-center">
      <span className="text-xs text-muted-foreground animate-pulse">Carregando…</span>
    </div>
  );
}

/* ─── List Column (Google Tasks board style) ─── */
const ListColumn = memo(function ListColumn({
  listaId,
  listName,
  wahaSession,
  tarefas,
  responsaveis,
  recorrenciaMap,
  filterResponsavel,
  onDeleteList,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
}: {
  listaId: string | null;
  listName: string;
  wahaSession: string | null;
  tarefas: Tarefa[];
  responsaveis: { id: string; nome: string }[];
  recorrenciaMap: Map<string, Recorrencia>;
  filterResponsavel: string | null;
  onDeleteList?: () => void;
  onUpdateTask: (data: Partial<Tarefa> & { id: string }) => void;
  onDeleteTask: (id: string) => void;
  onCreateTask: (tarefa: Partial<Tarefa> & { titulo: string }) => void;
}) {
  const [taskInput, setTaskInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPermissoes, setShowPermissoes] = useState(false);
  const [showWahaConfig, setShowWahaConfig] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const BATCH_SIZE = 20;

  const { data: currentUser } = useCurrentUser();
  const { data: ownerId } = useListaOwner(listaId);
  const isOwner = listaId && currentUser?.id === ownerId;
  const updateLista = useUpdateLista();

  const filtered = filterResponsavel ? tarefas.filter((t) => t.responsavel === filterResponsavel) : tarefas;
  
  const getEffectiveDate = (t: Tarefa): string | null => {
    if (t.data_vencimento) return t.data_vencimento.slice(0, 10); // compare by date only
    const rec = recorrenciaMap.get(t.id);
    if (rec) return getNextRecurrenceDate(rec);
    return null;
  };

  const PRIORITY_RANK: Record<string, number> = { alta: 0, média: 1, baixa: 2 };

  const sortByDate = (a: Tarefa, b: Tarefa) => {
    // Prioridade primeiro (alta → média → baixa → sem prioridade)
    const prioA = a.prioridade ? (PRIORITY_RANK[a.prioridade] ?? 3) : 3;
    const prioB = b.prioridade ? (PRIORITY_RANK[b.prioridade] ?? 3) : 3;
    if (prioA !== prioB) return prioA - prioB;
    // Mesma prioridade: ordena por data crescente
    const dateA = getEffectiveDate(a);
    const dateB = getEffectiveDate(b);
    if (!dateA && !dateB) return (a.ordem ?? 0) - (b.ordem ?? 0);
    if (!dateA) return 1;
    if (!dateB) return -1;
    const diff = dateA.localeCompare(dateB);
    if (diff !== 0) return diff;
    return (a.ordem ?? 0) - (b.ordem ?? 0);
  };
  const pending = filtered.filter((t) => t.status !== "concluído").sort(sortByDate);
  const done = filtered.filter((t) => t.status === "concluído").sort(sortByDate);
  const visiblePending = pending.slice(0, visibleCount);
  const hasMore = pending.length > visibleCount;

  const addTask = () => {
    const titulo = taskInput.trim();
    if (!titulo) return;
    onCreateTask({ titulo, lista_id: listaId, status: "pendente" });
    setTaskInput("");
    setShowInput(false);
  };

  const droppableId = listaId || "__no_list__";

  return (
    <div className="bg-card border border-border rounded-lg w-full md:min-w-[340px] md:max-w-[440px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <h3 className="text-base font-medium text-foreground">{listName}</h3>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-popover border border-border rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
              {listaId && (
                <button
                  onClick={() => { setShowPermissoes(true); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartilhar
                </button>
              )}
              {listaId && isOwner && (
                <button
                  onClick={() => { setShowWahaConfig(!showWahaConfig); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Sessão WhatsApp
                  {wahaSession && <span className="ml-auto text-xs text-muted-foreground">{wahaSession}</span>}
                </button>
              )}
              {showWahaConfig && listaId && (
                <div className="px-3 py-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Sessão para envios:</p>
                  <select
                    className="w-full text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
                    value={wahaSession || ""}
                    onChange={(e) => {
                      updateLista.mutate({ id: listaId, waha_session: e.target.value || null });
                      setShowWahaConfig(false);
                      setShowMenu(false);
                    }}
                  >
                    <option value="">— sem sessão —</option>
                    {WAHA_SESSIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              {onDeleteList && isOwner && (
                <button
                  onClick={() => { onDeleteList(); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-muted transition-colors border-t border-border mt-1"
                >
                  Excluir lista
                </button>
              )}
            </div>
          )}
          {showPermissoes && listaId && (
            <ListaPermissoesModal
              listaId={listaId}
              listaNome={listName}
              onClose={() => setShowPermissoes(false)}
            />
          )}
        </div>
      </div>

      {/* Add task button */}
      <div className="px-4 pb-2">
        {showInput ? (
          <form
            onSubmit={(e) => { e.preventDefault(); addTask(); }}
            className="flex items-center gap-2"
          >
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Nova tarefa…"
              autoFocus
              onBlur={() => { if (!taskInput.trim()) setShowInput(false); }}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none py-1.5 border-b border-primary focus:border-primary transition-colors"
            />
            <button type="submit" disabled={!taskInput.trim()} className="text-primary disabled:opacity-30">
              <Plus className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors w-full py-1"
          >
            <CheckSquare className="h-4 w-4" />
            Adicionar uma tarefa
          </button>
        )}
      </div>

      {/* Task list - droppable */}
      <Droppable droppableId={droppableId} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[40px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
          >
            {visiblePending.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`${snapshot.isDragging ? "shadow-lg rounded-lg bg-card z-50 border border-border" : ""}`}
                  >
                    <TaskItem
                      task={task}
                      responsaveis={responsaveis}
                      recorrencia={recorrenciaMap.get(task.id)}
                      dragHandleProps={provided.dragHandleProps}
                      onUpdate={onUpdateTask}
                      onDelete={onDeleteTask}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {hasMore && <InfiniteScrollSentinel onVisible={() => setVisibleCount((c) => c + BATCH_SIZE)} />}
          </div>
        )}
      </Droppable>

      {/* Completed tasks section */}
      {done.length > 0 && (
        <div className="border-t border-border/50">
          <button
            onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-4 py-3"
          >
            <motion.div animate={{ rotate: showDone ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight className="h-4 w-4" />
            </motion.div>
            <span>Concluídas ({done.length})</span>
          </button>
          <AnimatePresence>
            {showDone && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {done.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    responsaveis={responsaveis}
                    recorrencia={recorrenciaMap.get(task.id)}
                    onUpdate={onUpdateTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

/* ─── Board View ─── */
function BoardView({
  listas,
  allTarefas,
  responsaveis,
  recorrenciaMap,
  filterResponsavel,
  onDeleteList,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
}: {
  listas: { id: string; nome: string; waha_session: string | null }[];
  allTarefas: Tarefa[];
  responsaveis: { id: string; nome: string }[];
  recorrenciaMap: Map<string, Recorrencia>;
  filterResponsavel: string | null;
  onDeleteList: (id: string) => void;
  onUpdateTask: (data: Partial<Tarefa> & { id: string }) => void;
  onDeleteTask: (id: string) => void;
  onCreateTask: (tarefa: Partial<Tarefa> & { titulo: string }) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 items-stretch md:items-start">
      {listas.map((lista) => {
        const tarefas = allTarefas.filter((t) => t.lista_id === lista.id);
        return (
          <ListColumn
            key={lista.id}
            listaId={lista.id}
            listName={lista.nome}
            wahaSession={lista.waha_session ?? null}
            tarefas={tarefas}
            responsaveis={responsaveis}
            recorrenciaMap={recorrenciaMap}
            filterResponsavel={filterResponsavel}
            onDeleteList={() => onDeleteList(lista.id)}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onCreateTask={onCreateTask}
          />
        );
      })}
      {listas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 w-full text-center">
          <ListTodo className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground/60">Nenhuma lista criada</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Crie uma lista na barra lateral</p>
        </div>
      )}
    </div>
  );
}

/* ─── Single List View ─── */
function SingleListView({
  listaId,
  listName,
  wahaSession,
  tarefas,
  responsaveis,
  recorrenciaMap,
  filterResponsavel,
  onDeleteList,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
}: {
  listaId: string;
  listName: string;
  wahaSession: string | null;
  tarefas: Tarefa[];
  responsaveis: { id: string; nome: string }[];
  recorrenciaMap: Map<string, Recorrencia>;
  filterResponsavel: string | null;
  onDeleteList: () => void;
  onUpdateTask: (data: Partial<Tarefa> & { id: string }) => void;
  onDeleteTask: (id: string) => void;
  onCreateTask: (tarefa: Partial<Tarefa> & { titulo: string }) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <ListColumn
        listaId={listaId}
        listName={listName}
        wahaSession={wahaSession}
        tarefas={tarefas}
        responsaveis={responsaveis}
        recorrenciaMap={recorrenciaMap}
        filterResponsavel={filterResponsavel}
        onDeleteList={onDeleteList}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onCreateTask={onCreateTask}
      />
    </div>
  );
}

/* ─── Sidebar Nav Item ─── */
function SidebarItem({
  active,
  icon: Icon,
  label,
  count,
  onClick,
  onDelete,
  dragHandleProps,
  showCheckbox,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  onClick: () => void;
  onDelete?: () => void;
  dragHandleProps?: any;
  showCheckbox?: boolean;
}) {
  return (
    <div className="group flex items-center">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors px-0.5"
        >
          <div className="h-3.5 w-3.5 flex flex-col justify-center items-center gap-[2px]">
            <div className="w-1 h-1 rounded-full bg-current" />
            <div className="w-1 h-1 rounded-full bg-current" />
          </div>
        </div>
      )}
      {showCheckbox && (
        <div className="ml-1 mr-1">
          <div className="h-4 w-4 rounded bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      )}
      <button
        onClick={onClick}
        className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-sidebar-foreground hover:bg-muted/60"
        }`}
      >
        {!showCheckbox && <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />}
        <span className="flex-1 text-left truncate">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="text-xs text-muted-foreground">{count}</span>
        )}
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all rounded hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function TaskManager() {
  const { data: listas = [] } = useListas();
  const { data: allTarefas = [] } = useAllTarefas();
  const { data: allRecorrencias = [] } = useAllRecorrencias();
  const { data: responsaveis = [] } = useResponsaveis();
  const createLista = useCreateLista();
  const deleteLista = useDeleteLista();
  const reorderListas = useReorderListas();
  const reorderTarefas = useReorderTarefas();
  const updateTarefa = useUpdateTarefa();
  const deleteTarefa = useDeleteTarefa();
  const createTarefa = useCreateTarefa();

  const [selectedListaId, setSelectedListaId] = useState<string | null>(null);
  const [filterResponsavel, setFilterResponsavel] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showResponsaveis, setShowResponsaveis] = useState(false);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showResponsaveisModal, setShowResponsaveisModal] = useState(false);
  const [showLixeira, setShowLixeira] = useState(false);

  const { data: isAdmin } = useIsAdmin();
  const { data: deletedTarefas = [] } = useDeletedTarefas();
  const restoreTarefa = useRestoreTarefa();

  // Build recorrencia map once (eliminates N+1 queries)
  const recorrenciaMap = useMemo(() => {
    const map = new Map<string, Recorrencia>();
    allRecorrencias.forEach((r) => map.set(r.tarefa_modelo_id, r));
    return map;
  }, [allRecorrencias]);

  // Generate recurring tasks automatically
  useEffect(() => {
    if (allRecorrencias.length === 0 || allTarefas.length === 0) return;

    const activeRecs = allRecorrencias.filter((r) => r.ativo);
    if (activeRecs.length === 0) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");

    for (const rec of activeRecs) {
      // Respect data_fim
      if (rec.data_fim && rec.data_fim < todayStr) continue;

      const nextDate = getNextRecurrenceDate(rec);
      if (!nextDate) continue;

      // Respect data_fim for next date too
      if (rec.data_fim && nextDate > rec.data_fim) continue;

      // Check if a child task already exists for this date
      const alreadyExists = allTarefas.some(
        (t) =>
          t.tarefa_modelo_id === rec.tarefa_modelo_id &&
          t.data_vencimento?.slice(0, 10) === nextDate &&
          t.status !== "concluído"
      );
      if (alreadyExists) continue;

      // Find the template task
      const template = allTarefas.find((t) => t.id === rec.tarefa_modelo_id);
      if (!template) continue;

      createTarefa.mutate({
        titulo: template.titulo,
        lista_id: template.lista_id,
        tarefa_modelo_id: template.id,
        data_vencimento: nextDate,
        status: "pendente",
      });
    }
  }, [allRecorrencias, allTarefas]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleUpdateTask = useCallback((data: Partial<Tarefa> & { id: string }) => {
    updateTarefa.mutate(data);
  }, [updateTarefa]);

  const handleDeleteTask = useCallback((id: string) => {
    deleteTarefa.mutate(id);
  }, [deleteTarefa]);

  const handleCreateTask = useCallback((tarefa: Partial<Tarefa> & { titulo: string }) => {
    createTarefa.mutate(tarefa);
  }, [createTarefa]);


  const isAllView = selectedListaId === null;

  const addList = () => {
    const nome = newListName.trim();
    if (!nome) return;
    createLista.mutate(nome);
    setNewListName("");
    setShowNewListInput(false);
  };

  const taskCountByList = useMemo(() => {
    return listas.reduce<Record<string, number>>((acc, lista) => {
      acc[lista.id] = allTarefas.filter((t) => t.lista_id === lista.id && t.status !== "concluído").length;
      return acc;
    }, {});
  }, [listas, allTarefas]);

  const selectedListName = selectedListaId
    ? listas.find((l) => l.id === selectedListaId)?.nome ?? ""
    : "";

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteList = (id: string) => {
    deleteLista.mutate(id);
    if (selectedListaId === id) setSelectedListaId(null);
  };

  /* ─── Sidebar List DnD ─── */
  const handleSidebarDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    const reordered = Array.from(listas);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    reorderListas.mutate(reordered.map((l) => l.id));
  };

  /* ─── Task DnD ─── */
  const handleTaskDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (result.type === "TASK") {
      const sourceListId = source.droppableId === "__no_list__" ? null : source.droppableId;
      const destListId = destination.droppableId === "__no_list__" ? null : destination.droppableId;

      const sourceTasks = allTarefas
        .filter((t) => t.lista_id === sourceListId && t.status !== "concluído")
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

      if (sourceListId === destListId) {
        const reordered = Array.from(sourceTasks);
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        reorderTarefas.mutate(reordered.map((t, i) => ({ id: t.id, ordem: i })));
      } else {
        const destTasks = allTarefas
          .filter((t) => t.lista_id === destListId && t.status !== "concluído")
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

        const [moved] = sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, moved);

        const updates = [
          ...sourceTasks.map((t, i) => ({ id: t.id, ordem: i })),
          ...destTasks.map((t, i) => ({ id: t.id, ordem: i, lista_id: destListId })),
        ];
        reorderTarefas.mutate(updates);
      }
    }
  };

  // Derive per-list tasks from allTarefas
  const selectedListTarefas = useMemo(() => {
    if (!selectedListaId) return [];
    return allTarefas.filter((t) => t.lista_id === selectedListaId);
  }, [allTarefas, selectedListaId]);

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed md:sticky top-0 left-0 h-screen w-[260px] border-r border-border bg-sidebar z-40 flex flex-col"
          >
            {/* Create button */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => setShowNewListInput(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-foreground"
              >
                <Plus className="h-4 w-4" />
                Criar
              </button>
            </div>

            {showNewListInput && (
              <div className="px-4 pb-2">
                <form onSubmit={(e) => { e.preventDefault(); addList(); }} className="flex items-center gap-2">
                  <input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Nome da lista…"
                    autoFocus
                    onBlur={() => { if (!newListName.trim()) setShowNewListInput(false); }}
                    className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none border-b border-primary py-1.5"
                  />
                  <button type="submit" disabled={!newListName.trim()} className="text-primary disabled:opacity-30">
                    <Plus className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {/* All tasks */}
              <SidebarItem
                active={isAllView}
                icon={CheckSquare}
                label="Todas as tarefas"
                count={allTarefas.filter((t) => t.status !== "concluído").length}
                onClick={() => { setSelectedListaId(null); closeSidebarOnMobile(); }}
              />

              {/* Lists section */}
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-medium text-muted-foreground/60">Listas</span>
              </div>

              <DragDropContext onDragEnd={handleSidebarDragEnd}>
                <Droppable droppableId="sidebar-lists" type="SIDEBAR_LIST">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-0.5">
                      {listas.map((lista, index) => (
                        <Draggable key={lista.id} draggableId={`sidebar-${lista.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${snapshot.isDragging ? "bg-sidebar shadow-md rounded-lg z-50" : ""}`}
                            >
                              <SidebarItem
                                active={selectedListaId === lista.id}
                                icon={ListTodo}
                                label={lista.nome}
                                count={taskCountByList[lista.id]}
                                showCheckbox
                                onClick={() => { setSelectedListaId(lista.id); closeSidebarOnMobile(); }}
                                onDelete={() => handleDeleteList(lista.id)}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Create list inline */}
              <button
                onClick={() => setShowNewListInput(true)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Plus className="h-4 w-4" />
                <span>Criar nova lista</span>
              </button>

              {/* Responsáveis section */}
              <div className="pt-4 pb-1 px-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowResponsaveis(!showResponsaveis)}
                    className="flex items-center gap-1.5 group"
                  >
                    <motion.div animate={{ rotate: showResponsaveis ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                    </motion.div>
                    <span className="text-xs font-medium text-muted-foreground/60">Responsáveis</span>
                  </button>
                  <button
                    onClick={() => setShowResponsaveisModal(true)}
                    title="Gerenciar responsáveis"
                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5 rounded"
                  >
                    <Settings2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showResponsaveis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-0.5"
                  >
                    <SidebarItem
                      active={filterResponsavel === null}
                      icon={Users}
                      label="Todos"
                      onClick={() => { setFilterResponsavel(null); closeSidebarOnMobile(); }}
                    />
                    {responsaveis.map((resp) => (
                      <SidebarItem
                        key={resp.id}
                        active={filterResponsavel === resp.nome}
                        icon={User}
                        label={resp.nome}
                        onClick={() => { setFilterResponsavel(filterResponsavel === resp.nome ? null : resp.nome); closeSidebarOnMobile(); }}
                      />
                    ))}
                    <button
                      onClick={() => setShowResponsaveisModal(true)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Gerenciar responsáveis</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/60"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">
              {isAllView ? "Tarefas" : selectedListName}
            </h2>
          </div>
          {filterResponsavel && (
            <button
              onClick={() => setFilterResponsavel(null)}
              className="flex items-center gap-1.5 text-xs bg-accent text-accent-foreground rounded-full px-2.5 py-1 hover:bg-accent/80 transition-colors ml-auto"
            >
              <Filter className="h-3 w-3" />
              {filterResponsavel}
              <X className="h-3 w-3" />
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setShowLixeira(true)}
              title={`Lixeira (${deletedTarefas.length})`}
              className="relative text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {deletedTarefas.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                  {deletedTarefas.length > 9 ? "9+" : deletedTarefas.length}
                </span>
              )}
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                title="Painel Admin"
                className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              title="Sair"
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
          {showResponsaveisModal && <ResponsaveisModal onClose={() => setShowResponsaveisModal(false)} />}
          {/* Modal Lixeira */}
          {showLixeira && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLixeira(false)}>
              <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Lixeira ({deletedTarefas.length})</h2>
                  <button onClick={() => setShowLixeira(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {deletedTarefas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Lixeira vazia</p>
                  ) : deletedTarefas.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 border border-border rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          Excluída {t.deleted_at ? new Date(t.deleted_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ""}
                          {t.responsavel && ` · ${t.responsavel}`}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreTarefa.mutate(t.id)}
                        className="text-xs bg-primary text-primary-foreground rounded-md px-2.5 py-1 hover:bg-primary/90 transition-colors shrink-0"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <DragDropContext onDragEnd={handleTaskDragEnd}>
            {isAllView ? (
              <BoardView
                listas={listas}
                allTarefas={allTarefas}
                responsaveis={responsaveis}
                recorrenciaMap={recorrenciaMap}
                filterResponsavel={filterResponsavel}
                onDeleteList={handleDeleteList}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateTask={handleCreateTask}
              />
            ) : (
              <SingleListView
                listaId={selectedListaId!}
                listName={selectedListName}
                wahaSession={listas.find(l => l.id === selectedListaId)?.waha_session ?? null}
                tarefas={selectedListTarefas}
                responsaveis={responsaveis}
                recorrenciaMap={recorrenciaMap}
                filterResponsavel={filterResponsavel}
                onDeleteList={() => handleDeleteList(selectedListaId!)}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateTask={handleCreateTask}
              />
            )}
          </DragDropContext>
        </div>
      </main>
    </div>
  );
}

