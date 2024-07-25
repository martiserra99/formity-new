import { Variables } from "expry";

import { StepSchema, ItemSchema } from "../../../types/schema";
import { Result } from "../../../types/result";
import { FlowFields } from "../../../types/fields";
import { Position } from "../../../types/position";
import { Components, Parameters } from "../../../types/components";

import { FormSchemaUtils } from "./types/form";
import { ReturnSchemaUtils } from "./types/return";

export namespace StepSchemaUtils {
  export function is(schema: ItemSchema): schema is StepSchema {
    return FormSchemaUtils.is(schema) || ReturnSchemaUtils.is(schema);
  }

  export function getResult<T extends Parameters>(
    schema: StepSchema,
    variables: Variables,
    components: Components<T>,
    fields: FlowFields,
    path: Position[]
  ): Result {
    if (FormSchemaUtils.is(schema)) return FormSchemaUtils.getResult(schema, variables, components, fields, path);
    if (ReturnSchemaUtils.is(schema)) return ReturnSchemaUtils.getResult(schema, variables);
    throw new Error("Invalid schema");
  }
}
