import { asc } from "drizzle-orm";
import { db } from "@/shared/db";
import {
  type ContentType,
  memberWorkType,
  user,
  workflowStep,
  workType,
} from "@/shared/db/schema";

export type WorkTypeRow = {
  id: string;
  name: string;
  ideaStatus: (typeof workType.$inferSelect)["ideaStatus"];
  /** Members who do this work. */
  doerIds: string[];
};

export type StepRow = {
  contentType: ContentType;
  workTypeId: string;
  daysBefore: number;
};

/** The whole workflow: kinds of work in order, who does each, every content type's steps, and the team. */
export async function getWorkflow() {
  const [types, doers, steps, members] = await Promise.all([
    db
      .select({
        id: workType.id,
        name: workType.name,
        ideaStatus: workType.ideaStatus,
      })
      .from(workType)
      .orderBy(asc(workType.position), asc(workType.createdAt)),
    db
      .select({
        workTypeId: memberWorkType.workTypeId,
        userId: memberWorkType.userId,
      })
      .from(memberWorkType),
    db
      .select({
        contentType: workflowStep.contentType,
        workTypeId: workflowStep.workTypeId,
        daysBefore: workflowStep.daysBefore,
      })
      .from(workflowStep),
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .orderBy(asc(user.name)),
  ]);
  const workTypes: WorkTypeRow[] = types.map((type) => ({
    ...type,
    doerIds: doers
      .filter((doer) => doer.workTypeId === type.id)
      .map((doer) => doer.userId),
  }));
  return { workTypes, steps: steps as StepRow[], members };
}
