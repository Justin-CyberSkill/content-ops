"use client";

import { CheckIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Input } from "@/shared/ui/input";
import { matchesName } from "../lib/match-name";

type Member = { id: string; name: string };

/** From this many people a search box shows, so a long team stays quick to pick from. */
const SEARCH_FROM = 7;

/**
 * Who does a kind of work, as a list of checkboxes named `doer`. People already picked
 * come first. Search only hides rows, so picks outside the search still submit.
 */
export function PeoplePicker({
  members,
  defaultPicked,
}: {
  members: Member[];
  defaultPicked: string[];
}) {
  const t = useTranslations("workflow");
  const id = useId();
  const [picked, setPicked] = useState(() => new Set(defaultPicked));
  const [query, setQuery] = useState("");
  // Sorted once, so a row doesn't jump away from the pointer when it's ticked.
  const [ordered] = useState(() =>
    [...members].sort(
      (a, b) =>
        Number(defaultPicked.includes(b.id)) -
        Number(defaultPicked.includes(a.id)),
    ),
  );
  const shown = ordered.filter((member) => matchesName(member.name, query));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 flex w-full items-baseline justify-between gap-3 pl-1 text-[13px] font-medium">
        {t("whoDoesIt")}
        <span className="font-normal text-muted-foreground tabular-nums">
          {t("pickedCount", { count: picked.size })}
        </span>
      </legend>
      {members.length >= SEARCH_FROM ? (
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label={t("searchPeople")}
            placeholder={t("searchPeople")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-10"
          />
        </div>
      ) : null}
      <ul className="flex max-h-64 flex-col overflow-y-auto rounded-xl bg-muted p-1">
        {ordered.map((member) => {
          const checkId = `${id}-${member.id}`;
          return (
            <li key={member.id} hidden={!shown.includes(member)}>
              <label
                htmlFor={checkId}
                className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted-strong has-focus-visible:outline-2 has-focus-visible:outline-ring"
              >
                <input
                  id={checkId}
                  type="checkbox"
                  name="doer"
                  value={member.id}
                  checked={picked.has(member.id)}
                  onChange={(event) => {
                    const next = new Set(picked);
                    if (event.target.checked) next.add(member.id);
                    else next.delete(member.id);
                    setPicked(next);
                  }}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center rounded-md bg-card text-transparent ring-[1.5px] ring-muted-foreground ring-inset peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:ring-0"
                >
                  <CheckIcon className="size-3" strokeWidth={4} />
                </span>
                <span className="min-w-0 break-words">{member.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {shown.length ? null : (
        <p className="pl-1 text-xs text-muted-foreground">
          {t("noMatch", { query })}
        </p>
      )}
      {picked.size ? null : (
        <p className="pl-1 text-xs text-muted-foreground">{t("noDoers")}</p>
      )}
    </fieldset>
  );
}
