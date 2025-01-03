import type { Flow } from "../types/flow/flow";
import type { Cursor } from "../types/flow/cursor";
import type { Position } from "../types/flow/position";
import type { ListEntries, FlowEntries } from "../types/flow/entries";

import type { ListSchema as CustomListSchema } from "../types/schema/custom";
import type { OnYield as CustomOnYield } from "../types/callbacks/custom";
import type { OnReturn as CustomOnReturn } from "../types/callbacks/custom";

import type { ListSchema } from "../types/schema/static";
import type { FlowSchema } from "../types/schema/static";
import type { FormSchema } from "../types/schema/static";
import type { OnYield, OnReturn } from "../types/callbacks/static";

import type { ListValues } from "../types/values";

import * as FlowSchemaUtils from "./schema/flow";
import * as FormSchemaUtils from "./schema/form";
import * as YieldSchemaUtils from "./schema/yield";
import * as ReturnSchemaUtils from "./schema/return";
import * as VariablesSchemaUtils from "./schema/variables";

import * as FlowEntriesUtils from "./entries/flow";

/**
 * Initializes the multi-step form and returns its initial state, including a cursor
 * pointing to the first form step. If no form step is found, or if a return operation
 * is encountered before reaching a form, an error is thrown.
 *
 * During traversal of the multi-step form, the `onYield` callback is triggered whenever
 * a yield operation is encountered, allowing for intermediate values to be processed.
 *
 * @param schema The `ListSchema` object that defines the structure and behavior of the multi-step form.
 * @param values An object containing the initial input values for the multi-step form.
 * @param onYield A callback function triggered when the multi-step form yields values.
 * @returns The initial state of the form as a `Flow` object.
 *
 * @throws An error if no form step is found or if a return operation is encountered before a form step.
 */
export function initFlow<
  Render,
  Values extends ListValues,
  Inputs extends object,
  Params extends object
>(
  schema: CustomListSchema<Render, Values, Inputs, Params>,
  values: Inputs,
  onYield: CustomOnYield<Values>
): Flow {
  const sSchema = schema as ListSchema;
  const sValues = values as object;
  const sOnYield = onYield as OnYield;
  return internalInitFlow(sSchema, sValues, sOnYield);
}

function internalInitFlow(
  schema: ListSchema,
  values: object,
  onYield: OnYield
): Flow {
  const path = initialPath(schema, values);
  const form = initialForm(schema, { path, values }, onYield);
  const entries: ListEntries = { type: "list", list: {} };
  return { cursors: [form], entries };
}

function initialPath(schema: ListSchema, values: object): Position[] {
  const path = initialPathOrNull(schema, values);
  if (path) return path;
  throw new Error("Invalid schema");
}

function initialPathOrNull(
  schema: FlowSchema,
  values: object
): Position[] | null {
  let position = FlowSchemaUtils.into(schema, values);
  while (position) {
    const path = initialPathFromPosition(schema, position, values);
    if (path) return path;
    position = FlowSchemaUtils.next(schema, position, values);
  }
  return null;
}

function initialPathFromPosition(
  schema: FlowSchema,
  position: Position,
  values: object
): Position[] | null {
  const item = FlowSchemaUtils.find(schema, [position]);
  if (FlowSchemaUtils.is(item)) {
    const path = initialPathOrNull(item, values);
    if (path) return [position, ...path];
    else return null;
  }
  return [position];
}

function initialForm(
  schema: ListSchema,
  cursor: Cursor,
  onYield: OnYield
): Cursor {
  let currCursor: Cursor | null = cursor;
  let currValues = currCursor.values;
  let currSchema = FlowSchemaUtils.find(schema, currCursor.path);
  while (!FormSchemaUtils.is(currSchema)) {
    if (ReturnSchemaUtils.is(currSchema)) {
      throw new Error("Invalid schema");
    } else if (YieldSchemaUtils.is(currSchema)) {
      const values = currSchema["yield"](currValues);
      onYield(values);
    } else if (VariablesSchemaUtils.is(currSchema)) {
      const variables = currSchema["variables"](currValues);
      currValues = { ...currValues, ...variables };
    }
    currCursor = nextCursor(schema, {
      path: currCursor.path,
      values: currValues,
    });
    if (!currCursor) {
      throw new Error("Invalid schema");
    }
    currSchema = FlowSchemaUtils.find(schema, currCursor.path);
  }
  return currCursor;
}

/**
 * Navigates to the next form step of the multi-step form and returns the updated state.
 * If there is no next form step, the returned state contains the current form step.
 *
 * The `onYield` callback is triggered whenever a yield operation is encountered during traversal,
 * allowing for intermediate values to be processed.
 *
 * The `onReturn` callback is triggered whenever a return operation is encountered during traversal,
 * allowing for final values to be processed.
 *
 * @param flow The current state of the multi-step form.
 * @param schema The `ListSchema` object representing the multi-step form.
 * @param values An object containing the generated values within the multi-step form.
 * @param onYield A callback function triggered when the multi-step form yields values.
 * @param onReturn A callback function triggered when the multi-step form returns values.
 * @returns The updated state of the multi-step form.
 */
export function nextFlow<
  Render,
  Values extends ListValues,
  Inputs extends object,
  Params extends object
>(
  flow: Flow,
  schema: CustomListSchema<Render, Values, Inputs, Params>,
  values: object,
  onYield: CustomOnYield<Values>,
  onReturn: CustomOnReturn<Values>
) {
  const sSchema = schema as ListSchema;
  const sOnYield = onYield as OnYield;
  const sOnReturn = onReturn as OnReturn;
  return internalNextFlow(flow, sSchema, values, sOnYield, sOnReturn);
}

function internalNextFlow(
  flow: Flow,
  schema: ListSchema,
  values: object,
  onYield: OnYield,
  onReturn: OnReturn
): Flow {
  const last = flow.cursors[flow.cursors.length - 1];
  const next = advanceForm(schema, last, values, onYield, onReturn);
  const cursors = next ? [...flow.cursors, next] : flow.cursors;
  const entries = updateEntries(flow, schema, values);
  return { cursors, entries };
}

function advanceForm(
  schema: ListSchema,
  cursor: Cursor,
  values: object,
  onYield: OnYield,
  onReturn: OnReturn
): Cursor | null {
  let currCursor: Cursor | null = nextCursor(schema, {
    path: cursor.path,
    values: { ...cursor.values, ...values },
  });
  if (!currCursor) {
    return null;
  }
  let currValues = currCursor.values;
  let currSchema = FlowSchemaUtils.find(schema, currCursor.path);
  while (!FormSchemaUtils.is(currSchema)) {
    if (ReturnSchemaUtils.is(currSchema)) {
      const values = currSchema["return"](currValues);
      onReturn(values);
      return null;
    } else if (YieldSchemaUtils.is(currSchema)) {
      const values = currSchema["yield"](currValues);
      onYield(values);
    } else if (VariablesSchemaUtils.is(currSchema)) {
      const variables = currSchema["variables"](currValues);
      currValues = { ...currValues, ...variables };
    }
    currCursor = nextCursor(schema, {
      path: currCursor.path,
      values: currValues,
    });
    if (!currCursor) {
      return null;
    }
    currSchema = FlowSchemaUtils.find(schema, currCursor.path);
  }
  return currCursor;
}

function nextCursor(schema: ListSchema, cursor: Cursor): Cursor | null {
  const next = nextCursorInFlow(schema, cursor);
  if (next) return next;
  const over = overCursor(cursor);
  if (over) return nextCursor(schema, over);
  return null;
}

function nextCursorInFlow(schema: ListSchema, cursor: Cursor): Cursor | null {
  const next = nextCursorInSameFlow(schema, cursor);
  if (next) {
    const into = nextCursorInsideFlow(schema, next);
    if (into) return into;
    return nextCursorInFlow(schema, next);
  }
  return null;
}

function nextCursorInSameFlow(
  schema: ListSchema,
  cursor: Cursor
): Cursor | null {
  const path = cursor.path.slice(0, -1);
  const flow = FlowSchemaUtils.find(schema, path) as FlowSchema;
  const curr = cursor.path[cursor.path.length - 1];
  const next = FlowSchemaUtils.next(flow, curr, cursor.values);
  if (next) {
    return { path: [...path, next], values: cursor.values };
  }
  return null;
}

function nextCursorInsideFlow(
  schema: ListSchema,
  cursor: Cursor
): Cursor | null {
  const item = FlowSchemaUtils.find(schema, cursor.path);
  if (FlowSchemaUtils.is(item)) {
    const position = FlowSchemaUtils.into(item, cursor.values);
    if (position) {
      const path = [...cursor.path, position];
      const next = { path, values: cursor.values };
      const into = nextCursorInsideFlow(schema, next);
      if (into) return into;
      return nextCursorInFlow(schema, next);
    }
    return null;
  }
  return cursor;
}

function overCursor(cursor: Cursor): Cursor | null {
  if (cursor.path.length > 1) {
    return { path: cursor.path.slice(0, -1), values: cursor.values };
  }
  return null;
}

/**
 * Navigates to the previous form step of the multi-step form and returns the updated state.
 * If there is no previous form step, the returned state contains the current form step.
 *
 * @param flow The current state of the multi-step form.
 * @param schema The `ListSchema` object representing the multi-step form.
 * @param values An object containing the generated values within the multi-step form.
 * @returns The updated state of the multi-step form.
 */
export function prevFlow<
  Render,
  Values extends ListValues,
  Inputs extends object,
  Params extends object
>(
  flow: Flow,
  schema: CustomListSchema<Render, Values, Inputs, Params>,
  values: object
): Flow {
  const sSchema = schema as ListSchema;
  return internalPrevFlow(flow, sSchema, values);
}

function internalPrevFlow(
  flow: Flow,
  schema: ListSchema,
  values: object
): Flow {
  const current = flow.cursors;
  const cursors = current.length > 1 ? current.slice(0, -1) : current;
  const entries = updateEntries(flow, schema, values);
  return { cursors, entries };
}

function updateEntries(
  flow: Flow,
  schema: ListSchema,
  values: object
): ListEntries {
  const cursor = flow.cursors[flow.cursors.length - 1];
  const form = FlowSchemaUtils.find(schema, cursor.path) as FormSchema;
  const vals = form["form"]["values"](cursor.values);
  let curr: FlowEntries = flow.entries;
  for (const [name, value] of Object.entries(values)) {
    const key = name as keyof typeof vals;
    curr = FlowEntriesUtils.set(curr, cursor.path, name, vals[key][1], value);
  }
  return curr as ListEntries;
}
