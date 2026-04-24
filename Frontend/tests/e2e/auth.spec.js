import { test, expect } from "@playwright/test";

test("redirects unauthenticated user to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText("Entrar no sistema")).toBeVisible();
});

test("shows register entry point", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Criar cadastro" })).toBeVisible();
});
