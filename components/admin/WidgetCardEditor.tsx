"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminFields";
import WidgetCardIcon from "@/components/WidgetCardIcon";
import {
  WIDGET_ICON_OPTIONS,
  createWidgetCardId,
  type WidgetCard,
} from "@/lib/widgetCards";
import type { FieldErrors } from "@/lib/profileValidation";

type WidgetCardEditorProps = {
  label: string;
  description: string;
  cards: WidgetCard[];
  errors: FieldErrors;
  errorPrefix: string;
  showCount?: boolean;
  onChange: (cards: WidgetCard[]) => void;
};

function moveCard(cards: WidgetCard[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= cards.length) return cards;

  const next = [...cards];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next.map((card, sortOrder) => ({ ...card, sortOrder }));
}

export default function WidgetCardEditor({
  label,
  description,
  cards,
  errors,
  errorPrefix,
  showCount = false,
  onChange,
}: WidgetCardEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    cards[0] ? new Set([cards[0].id]) : new Set()
  );

  const cardIdsKey = cards.map((card) => card.id).join("|");
  const [prevCardIdsKey, setPrevCardIdsKey] = useState(cardIdsKey);

  if (cardIdsKey !== prevCardIdsKey) {
    setPrevCardIdsKey(cardIdsKey);
    const validIds = cardIdsKey.split("|").filter(Boolean);
    const firstId = validIds[0];
    const validIdSet = new Set(validIds);
    const next = new Set([...expandedIds].filter((id) => validIdSet.has(id)));
    if (next.size === 0 && firstId) {
      next.add(firstId);
    }
    setExpandedIds(next);
  }

  const toggleCard = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateCard = (index: number, patch: Partial<WidgetCard>) => {
    onChange(
      cards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...patch } : card
      )
    );
  };

  const removeCard = (index: number) => {
    onChange(
      cards
        .filter((_, cardIndex) => cardIndex !== index)
        .map((card, sortOrder) => ({ ...card, sortOrder }))
    );
  };

  const addCard = () => {
    const id = createWidgetCardId();
    onChange([
      ...cards,
      {
        id,
        icon: WIDGET_ICON_OPTIONS[0].value,
        count: "",
        title: "",
        description: "",
        sortOrder: cards.length,
      },
    ]);
    setExpandedIds((current) => new Set([...current, id]));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{label}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <button
          type="button"
          onClick={addCard}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40"
        >
          <Plus size={16} />
          Add card
        </button>
      </div>

      {errors[errorPrefix] ? (
        <p className="text-sm font-medium text-red-400">{errors[errorPrefix]}</p>
      ) : null}

      <div className="space-y-3">
        {cards.map((card, index) => {
          const isExpanded = expandedIds.has(card.id);
          const cardLabel = card.title.trim() || `Card ${index + 1}`;

          return (
            <div
              key={card.id}
              className="overflow-hidden rounded-xl border border-border bg-surface-elevated"
            >
              <div className="flex items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => toggleCard(card.id)}
                  aria-expanded={isExpanded}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40">
                    <WidgetCardIcon icon={card.icon} size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {cardLabel}
                    </p>
                    {!isExpanded && card.description.trim() ? (
                      <p className="truncate text-xs text-muted">
                        {card.description}
                      </p>
                    ) : null}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`ml-auto shrink-0 text-muted transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange(moveCard(cards, index, -1))}
                    disabled={index === 0}
                    className="rounded-lg border border-border p-2 text-muted transition hover:text-foreground disabled:opacity-40"
                    aria-label="Move card up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(moveCard(cards, index, 1))}
                    disabled={index === cards.length - 1}
                    className="rounded-lg border border-border p-2 text-muted transition hover:text-foreground disabled:opacity-40"
                    aria-label="Move card down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCard(index)}
                    disabled={cards.length === 1}
                    className="rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                    aria-label="Remove card"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t border-border px-4 pb-4 pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <AdminSelect
                      label="Icon"
                      value={card.icon}
                      error={errors[`${errorPrefix}.${index}.icon`]}
                      onChange={(event) =>
                        updateCard(index, { icon: event.target.value })
                      }
                      options={WIDGET_ICON_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                    />

                    {showCount ? (
                      <AdminInput
                        label="Highlight text (optional)"
                        value={card.count}
                        onChange={(event) =>
                          updateCard(index, { count: event.target.value })
                        }
                        placeholder="5000+"
                      />
                    ) : null}

                    <AdminInput
                      label="Title"
                      value={card.title}
                      error={errors[`${errorPrefix}.${index}.title`]}
                      onChange={(event) =>
                        updateCard(index, { title: event.target.value })
                      }
                      placeholder="Products"
                    />

                    <div className={showCount ? "md:col-span-2" : ""}>
                      <AdminTextarea
                        label="Description"
                        value={card.description}
                        error={errors[`${errorPrefix}.${index}.description`]}
                        onChange={(event) =>
                          updateCard(index, { description: event.target.value })
                        }
                        placeholder="Short supporting text"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
