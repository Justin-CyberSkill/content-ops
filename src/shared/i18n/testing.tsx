import { type RenderOptions, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "./messages/en.json";

/** Testing Library's render, wrapped in the English translations. Tests only. */
export function renderWithIntl(
  ui: React.ReactElement,
  options?: RenderOptions,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
