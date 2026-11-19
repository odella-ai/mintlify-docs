// Synthetic records rendered by the real app components; no product UI is drawn here.
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { AgentTimeAction } from '@odella/core';
import { TimeActionCalendar } from '@/odella/workforce/components/actions/time/time-action-calendar';
import { TimeActionDialog } from '@/odella/workforce/components/actions/time/time-action-dialog';
import { VaultEmployeesDialog } from '@/odella/account/components/vault/VaultEmployeesDialog';
import type { VaultClient } from '@/odella/account/components/vault/vault-client';
const prompt = 'Review this week’s support requests. Draft a summary of recurring issues and unresolved escalations for the operations team. Do not send messages or change records; return the draft for review.';
function schedule(id: string, name: string, cron: string, taskPrompt = prompt): AgentTimeAction {
  return {
    id, kind: 'time', name, description: null, enabled: true, status: 'active',
    task: { name, prompt: taskPrompt, completionContract: { outcome: taskPrompt }, notifyPolicy: 'announce' },
    event: { kind: 'time', timing: { type: 'cron', cron, timezone: 'Europe/London', excludedDates: [] } },
    lifecycle: { occurrencePolicy: 'continuous', maxOccurrences: null }, runCount: 0,
    nextOccurrenceAt: null, lastMatchedAt: null, completedAt: null, archivedAt: null, disabledReason: null,
  };
}
const weekly = schedule('docs-weekly-support', 'Weekly support summary', '0 16 * * 5');
const schedules = [
  schedule('docs-monday-check', 'Monday queue review', '0 9 * * 1', 'Review the support queue and return a short draft of priorities. Do not change tickets.'),
  schedule('docs-midweek-check', 'Midweek triage', '0 10 * * 3', 'Review unresolved support requests and draft an internal priority list. Do not change tickets.'),
  weekly,
  schedule('docs-monthly-review', 'Monthly supplier review', '0 10 1 * *'),
];
const noop = () => undefined;
export default { title: 'Docs/Key areas', parameters: { layout: 'fullscreen' } } satisfies Meta;
type Story = StoryObj;
export const Calendar: Story = { render: () => (
  <div className="bg-surface h-screen p-4">
    <div className="border-border-strong h-full overflow-hidden rounded-xl border">
      <TimeActionCalendar schedules={schedules} actionHistory={[]} initialAnchor={new Date('2027-02-08T12:00:00Z')} initialViewMode="month" onCreateTask={noop} />
    </div>
  </div>
) };
export const RecurringSchedule: Story = { render: () => (
  <TimeActionDialog open onOpenChange={noop} editingSchedule={weekly} onSave={noop} onDelete={noop} employeeName="Alex" />
) };
export const NewSchedule: Story = { render: () => (
  <TimeActionDialog open onOpenChange={noop} prefillDate={new Date('2027-02-12T16:00:00Z')} onSave={noop} employeeName="Alex" />
) };
const vaultItem = { id: 'docs-api-key', type: 'apikey' as const, title: 'Supplier API', websites: ['https://api.example.com'], revision: 1, createdAt: '2027-02-01T00:00:00Z', updatedAt: '2027-02-01T00:00:00Z' };
const sharingClient = async () => ({
  agentAccess: async () => ({ itemId: vaultItem.id, revision: 1, name: 'supplier-api', apiAuth: { style: 'bearer' }, grants: [{ agentId: 'alex-morgan', access: 'read' }] }),
  setAgentAccess: async () => { throw new Error('Documentation fixture: saving is disabled'); },
}) as unknown as VaultClient;
export const VaultEmployeeAccess: Story = { render: () => <VaultEmployeesDialog item={vaultItem} client={sharingClient} employees={[{ username: 'alex-morgan', name: 'Alex — supplier review' }, { username: 'sam-lee', name: 'Sam — operations' }]} onClose={noop} /> };
