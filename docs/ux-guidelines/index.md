# UX guidelines

Evidence-based rules for designing screens, flows and wording, for people and agents. Every rule comes from [Laws of UX](https://lawsofux.com/), [UX Myths](https://uxmyths.com/) or [The Decision Lab](https://thedecisionlab.com/biases). Its tag, like `[Hick]`, names the evidence in [evidence.md](evidence.md); read that file only to justify a rule, weigh two rules against each other, or decide a case no rule covers. Facts about how this app works today (glossary, routes, checks) are in [app-notes.md](app-notes.md).

## Principles

1. Design for how people behave, not for how they say they behave or how a rational person would. `[Myth: people are rational]` `[Myth: people can tell you what they want]`
2. Familiar beats original. People expect a product to work like the ones they already use. `[Jakob]` `[Myth: design has to be original]`
3. Less to think about, not less on screen. Remove what doesn't help the task; keep what does visible and labelled. `[Cognitive load]` `[Occam]` `[Myth: simple = minimal]`
4. The system carries the complexity: prefill, default and remember so people don't have to. `[Tesler]` `[Working memory]`
5. Make the one important thing stand out, and only that. `[Von Restorff]`
6. Respond fast, show progress, end well. `[Doherty]` `[Goal-gradient]` `[Peak-end]`
7. Agents propose; people decide. Make checking agent work easy and overriding it cheap. `[Automation bias]`
8. Help people decide; never trick them with slanted wording, decoys or false urgency. `[Framing]` `[Decoy]` `[Regret aversion]`
9. You are not the user. Check designs against real people and real use. `[Myth: you are like your users]`

## Pick the files for your task

Most tasks need one or two of these, plus accessibility.md before you finish.
- [layout.md](layout.md): arranging a screen: grouping, hierarchy, emphasis, images, white space, long pages.
- [navigation.md](navigation.md): menus, links, tabs, page names, search, wayfinding, changing a design people know.
- [forms-and-input.md](forms-and-input.md): fields, input, validation, error messages, buttons and tap targets, multi-step flows.
- [choices-and-decisions.md](choices-and-decisions.md): options, defaults, recommendations, comparisons, and numbers or metrics people decide from.
- [feedback-and-states.md](feedback-and-states.md): loading, waits, progress, empty, error and success states, endings.
- [writing.md](writing.md): any visible text: labels, buttons, headings, hints, errors, instructions.
- [ai-and-agents.md](ai-and-agents.md): anything an agent makes, suggests, changes or does, and how people review it.
- [accessibility.md](accessibility.md): every UI change, before you finish.
- [research-and-testing.md](research-and-testing.md): checking a design, asking users, reading feedback or metrics, deciding whether to redesign.
- [app-notes.md](app-notes.md): this app's glossary, EN/VI rules, routing gotchas and checks.

## Before you finish UI work

1. Walk the flow as a newcomer with a goal: is each next step obvious without instructions? `[Paradox of the active user]` `[Myth: you are like your users]`
2. Scan it: can someone get the point from headings, labels and key words alone? `[Myth: people read on the web]`
3. Look at what stands out: one primary action per view, nothing styled like an ad. `[Von Restorff]` `[Selective attention]`
4. Every action responds within 400 ms, and every flow ends on a clear result. `[Doherty]` `[Peak-end]`
5. Run the checks in accessibility.md and app-notes.md.

## Changing these rules

Add a rule only with evidence: a tag in evidence.md that links to its source. A rule about how this app currently works goes in app-notes.md instead.
