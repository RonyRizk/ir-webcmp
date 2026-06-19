import { AgentsTypes } from './../../src/components/ir-agents/types';
import { test, expect, Page, Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('loading-screen')).toBeHidden();
  await expect(page.getByTestId('ir-agents')).toBeVisible();
});

test.describe('Agent Form', () => {
  test('Tour Operator', async ({ page }) => {
    const createButton = page.getByTestId('create-agent-button');
    await expect(createButton).toBeVisible();
    await createButton.click();
    const agentEditForm = page.getByTestId('agent-editor-form');
    await expect(agentEditForm).toBeVisible();
    const agentProfileAgentTypeSelect = agentEditForm.getByTestId('agent-profile-agent-type-select');
    await expect(agentProfileAgentTypeSelect).toBeVisible();
    await agentProfileAgentTypeSelect.click();
    const option = agentProfileAgentTypeSelect.locator(`wa-option[value='${AgentsTypes.TOUR_OPERATOR}']`);
    await option.click();
    await expect(agentEditForm.getByTestId('agent-contract-identification-card')).toBeHidden();
  });
});
