"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { AdminInput, AdminSelect } from "@/components/admin/AdminFields";
import SocialLinkIcon from "@/components/SocialLinkIcon";
import {
  createSocialLinkId,
  getSocialIconSelectValue,
  isCustomSocialIcon,
  SOCIAL_ICON_OPTIONS,
  type SocialLink,
} from "@/lib/socialLinks";
import type { FieldErrors } from "@/lib/profileValidation";

type SocialLinkEditorProps = {
  links: SocialLink[];
  errors: FieldErrors;
  errorPrefix: string;
  onChange: (links: SocialLink[]) => void;
};

function moveLink(links: SocialLink[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= links.length) return links;

  const next = [...links];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export default function SocialLinkEditor({
  links,
  errors,
  errorPrefix,
  onChange,
}: SocialLinkEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    links[0] ? new Set([links[0].id]) : new Set()
  );

  const linkIdsKey = links.map((link) => link.id).join("|");
  const [prevLinkIdsKey, setPrevLinkIdsKey] = useState(linkIdsKey);

  if (linkIdsKey !== prevLinkIdsKey) {
    setPrevLinkIdsKey(linkIdsKey);
    const validIds = linkIdsKey.split("|").filter(Boolean);
    const firstId = validIds[0];
    const validIdSet = new Set(validIds);
    const next = new Set([...expandedIds].filter((id) => validIdSet.has(id)));
    if (next.size === 0 && firstId) {
      next.add(firstId);
    }
    setExpandedIds(next);
  }

  const toggleLink = (id: string) => {
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

  const updateLink = (index: number, patch: Partial<SocialLink>) => {
    onChange(
      links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link
      )
    );
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, linkIndex) => linkIndex !== index));
  };

  const addLink = () => {
    const id = createSocialLinkId();
    onChange([
      ...links,
      {
        id,
        label: "",
        link: "",
        icon: "",
      },
    ]);
    setExpandedIds((current) => new Set([...current, id]));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Social links</h3>
          <p className="mt-1 text-sm text-muted">
            Add profile URLs and optional custom icon images for the footer.
          </p>
        </div>
        <button
          type="button"
          onClick={addLink}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40"
        >
          <Plus size={16} />
          Add link
        </button>
      </div>

      {errors[errorPrefix] ? (
        <p className="text-sm font-medium text-red-600 theme-dark:text-red-400">{errors[errorPrefix]}</p>
      ) : null}

      {links.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No social links yet. Click &quot;Add link&quot; to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => {
            const isExpanded = expandedIds.has(link.id);
            const linkLabel = link.label.trim() || `Link ${index + 1}`;

            return (
              <div
                key={link.id}
                className="overflow-hidden rounded-xl border border-border bg-surface-elevated"
              >
                <div className="flex items-center justify-between gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleLink(link.id)}
                    aria-expanded={isExpanded}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-surface">
                      <SocialLinkIcon icon={link.icon} label={link.label} size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {linkLabel}
                      </p>
                      {!isExpanded && link.link.trim() ? (
                        <p className="truncate text-xs text-muted">{link.link}</p>
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
                      onClick={() => onChange(moveLink(links, index, -1))}
                      disabled={index === 0}
                      className="rounded-lg border border-border p-2 text-muted transition hover:text-foreground disabled:opacity-40"
                      aria-label="Move link up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(moveLink(links, index, 1))}
                      disabled={index === links.length - 1}
                      className="rounded-lg border border-border p-2 text-muted transition hover:text-foreground disabled:opacity-40"
                      aria-label="Move link down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="rounded-lg border border-red-500/40 p-2 text-red-600 theme-dark:text-red-400 transition hover:bg-red-500/10"
                      aria-label="Remove link"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-border px-4 pb-4 pt-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <AdminInput
                        label="Label"
                        value={link.label}
                        error={errors[`${errorPrefix}.${index}.label`]}
                        onChange={(event) =>
                          updateLink(index, { label: event.target.value })
                        }
                        placeholder="LinkedIn"
                      />
                      <AdminInput
                        label="Profile URL"
                        type="url"
                        value={link.link}
                        error={errors[`${errorPrefix}.${index}.link`]}
                        onChange={(event) =>
                          updateLink(index, { link: event.target.value })
                        }
                        placeholder="https://linkedin.com/company/your-page"
                      />
                      <div className="md:col-span-2">
                        <AdminSelect
                          label="Icon"
                          value={getSocialIconSelectValue(link.icon)}
                          error={errors[`${errorPrefix}.${index}.icon`]}
                          placeholder="Select an icon"
                          options={SOCIAL_ICON_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value === "custom") {
                              updateLink(index, {
                                icon: isCustomSocialIcon(link.icon) ? link.icon : "",
                              });
                              return;
                            }
                            updateLink(index, { icon: value.toLowerCase() });
                          }}
                        />
                        {getSocialIconSelectValue(link.icon) === "custom" ? (
                          <div className="mt-4">
                            <AdminInput
                              label="Custom icon URL"
                              type="url"
                              value={link.icon}
                              error={errors[`${errorPrefix}.${index}.icon`]}
                              onChange={(event) =>
                                updateLink(index, { icon: event.target.value })
                              }
                              placeholder="https://example.com/icons/linkedin.png"
                            />
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-muted">
                            Choose a platform icon or select custom to use your own image URL.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
