import { Expry } from 'expry';

export type Schema = FlowSchema | ItemSchema;
export type FlowSchema = ListSchema | CondSchema | LoopSchema;
export type ListSchema = Schema[];
export type CondSchema = {
  cond: {
    if: Expry;
    then: ListSchema;
    else: ListSchema;
  };
};
export type LoopSchema = {
  loop: {
    while: Expry;
    do: ListSchema;
  };
};
export type ItemSchema = FormSchema | ReturnSchema | VariablesSchema;
export type FormSchema = { form: Expry };
export type ReturnSchema = { return: Expry };
export type VariablesSchema = { variables: Expry };
