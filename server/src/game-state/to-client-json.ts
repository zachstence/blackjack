export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArray = JSONValue[] | readonly JSONValue[]

export abstract class ToClientJSON<T extends JSONValue> {
    abstract toClientJSON(): T
}