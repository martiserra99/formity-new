/**
 * These utility types are designed to simplify and enhance the process of defining types
 * that extend `ListValues`. By using these types, you can create more readable and concise
 * code when structuring a multi-step form.
 */

import { ListValues } from "./values";

export type Cond<Values extends { then: ListValues; else: ListValues }> = {
  type: "cond";
  cond: {
    then: Values["then"];
    else: Values["else"];
  };
};

export type Loop<Values extends ListValues> = {
  type: "loop";
  loop: {
    do: Values;
  };
};

export type Form<Values extends object> = {
  type: "form";
  form: Values;
};

export type Yield<Values extends object> = {
  type: "yield";
  yield: Values;
};

export type Return<Values extends object> = {
  type: "return";
  return: Values;
};

export type Variables<Values extends object> = {
  type: "variables";
  variables: Values;
};
