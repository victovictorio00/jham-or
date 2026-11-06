import type { Page, Locator } from "@playwright/test";
export async function chooseOption(page: Page, label: string, value: string) {
  const trigger = page.getByRole("combobox", { name: label, exact: true });
  await trigger.click();
  await page
    .locator(`[role="option"][data-value="${value.replaceAll('"', '\\"')}"]`)
    .click();
}
export async function selectedValue(control: Locator) {
  return (await control.getAttribute("data-value")) || "";
}
