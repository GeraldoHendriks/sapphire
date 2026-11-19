import { expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render";
import { SAPPHIRE_VERSION, UPSTREAM_VERSION } from "../../sapphire/version";
import { AnchoredToastProvider } from "../ui/toast";
import { AboutVersionTitle } from "./AboutVersionTitle";

const VERSION_LABEL = `${SAPPHIRE_VERSION} (T3 Code ${UPSTREAM_VERSION})`;

it("copies the version without a notification", async () => {
  await using screen = await render(
    <AnchoredToastProvider>
      <AboutVersionTitle />
    </AnchoredToastProvider>,
  );
  using write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

  await screen.getByRole("button", { name: `Copy version ${VERSION_LABEL}` }).click();

  expect(write).toHaveBeenCalledWith(VERSION_LABEL);
  await expect.element(page.getByText(/^Copied!?$/)).not.toBeInTheDocument();
});
