import type { Outcome, OutcomeType } from '../../domain/models';
import { getJson, setJson } from '../localStore';
import { storageKeys } from '../storageKeys';

export async function listOutcomes(): Promise<Outcome[]> {
  const outcomes = await getJson<Outcome[]>(storageKeys.outcomes, []);
  return outcomes.sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}

export async function getOutcomeById(id: string): Promise<Outcome | undefined> {
  const outcomes = await listOutcomes();
  return outcomes.find((outcome) => outcome.id === id);
}

export async function getOutcomeByProjectId(projectId: string): Promise<Outcome | undefined> {
  const outcomes = await listOutcomes();
  return outcomes.find((outcome) => outcome.project_id === projectId);
}

export async function upsertOutcomeForProject(input: {
  projectId: string;
  type: OutcomeType;
  resultDescription: string;
}): Promise<Outcome> {
  const outcomes = await listOutcomes();
  const existing = outcomes.find((outcome) => outcome.project_id === input.projectId);
  const completedAt = new Date().toISOString();

  if (existing) {
    const updated: Outcome = {
      ...existing,
      type: input.type,
      resultDescription: input.resultDescription,
      completed_at: completedAt,
    };

    await setJson(
      storageKeys.outcomes,
      outcomes.map((outcome) => (outcome.id === existing.id ? updated : outcome)),
    );
    return updated;
  }

  const outcome: Outcome = {
    id: `outcome-${Date.now()}`,
    project_id: input.projectId,
    type: input.type,
    resultDescription: input.resultDescription,
    completed_at: completedAt,
  };

  await setJson(storageKeys.outcomes, [outcome, ...outcomes]);
  return outcome;
}
