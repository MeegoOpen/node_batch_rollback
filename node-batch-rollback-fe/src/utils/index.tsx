import { snakeCase } from "lodash";
import sdk, { SDKPromise } from "../sdk";
import { APP_KEY } from "../constants";

export const getLang = async () => {
  const sdk = await SDKPromise();
  const { language } = await sdk.Context.load();
  return language || "zh_CN";
};

export const handleErrorMsg = (e: any, minVersion?: string) => {
  let msg = "";
  if (e.name === "NotSupportedError") {
    msg = minVersion
      ? `当前客户端暂不支持，\n请升级飞书客户端到${minVersion}及以上版本`
      : "当前客户端暂不支持，\n请升级飞书客户端到最新版本";
  } else {
    msg = "内部错误:" + (e.message || e.originMessage);
  }
  // document.body.appendChild(document.createTextNode(msg));
};

export const getStorage: any = async (key: string) => {
  try {
    const res = await sdk.storage.getItem(key);
    return res ?? "";
  } catch (error) {
    console.error("getStorage", key, error);
    return "";
  }
};

export const setStorage = (key: string, value?: string) => {
  try {
    sdk.storage.setItem(key, value);
  } catch (error) {
    console.error("setStorage", key, value, error);
  }
};

export const removeStorage = (key: string) =>
  SDKPromise().then((sdk) => sdk.storage.removeItem(key));

export const copyText = async (text: string) =>
  SDKPromise().then((sdk) => sdk.clipboard.writeText(text));

export const getSpace = (projectKey: string) =>
  SDKPromise().then((sdk) => sdk.Space.load(projectKey));

export const getProjectKey = async () => {
  const [controlCtx, buttonCtx, configCtx, pageCtx, tabCtx, viewCtx] =
    await Promise.all([
      sdk.control.getContext().catch((e) => handleErrorMsg(e, "7.25.0")),
      sdk.button.getContext().catch((e) => handleErrorMsg(e, "7.25.0")),
      sdk.configuration.getContext().catch((e) => handleErrorMsg(e, "7.25.0")),
      sdk.page.getContext().catch((e) => handleErrorMsg(e, "7.25.0")),
      sdk.tab.getContext().catch((e) => handleErrorMsg(e, "7.25.0")),
      sdk.view.getContext().catch((e) => handleErrorMsg(e, "7.25.0")),
    ]);

  return (
    configCtx?.spaceId ||
    controlCtx?.spaceId ||
    buttonCtx?.spaceId ||
    pageCtx?.spaceId ||
    tabCtx?.spaceId ||
    viewCtx?.spaceId ||
    ""
  );
};

export const getWorkObject = (params: {
  spaceId: string;
  workObjectId: string;
}) => SDKPromise().then((sdk) => sdk.WorkObject.load(params));

export const getActiveWorkItem = async () => {
  const sdk = await SDKPromise();
  const { activeWorkItem } = await sdk.Context.load();
  return activeWorkItem;
};

export const getButtonContext = async () => {
  const sdk = await SDKPromise();
  return await sdk.button.getContext();
};

export const getActiveWorkItemFieldValues = async (fieldKeys: string[]) => {
  if (Array.isArray(fieldKeys)) {
    const sdk = await SDKPromise();
    const { activeWorkItem } = await sdk.Context.load();
    if (activeWorkItem) {
      const { id, workObjectId, spaceId } = activeWorkItem;
      const wi = await sdk.WorkItem.load({
        spaceId,
        workItemId: id,
        workObjectId,
      });
      return await Promise.all(fieldKeys.map((k) => wi.getFieldValue(k)));
    }
  }
  return [];
};

function isObject(value: any) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

const convertToSnake = (str: string) => snakeCase(str);

export const delay = (ms: number) =>
  new Promise((rev) => {
    setTimeout(() => {
      rev(1);
    }, ms);
  });

export const keysToSnakeCase = (obj: Record<string, any>): any => {
  if (!isObject(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnakeCase(item));
  }
  const result = {};
  for (const key of Object.keys(obj)) {
    let val = obj[key];
    if (Array.isArray(val)) {
      val = val.map((item) => keysToSnakeCase(item));
    } else if (isObject(val)) {
      val = keysToSnakeCase(val);
    }
    const snakeKey = convertToSnake(key);
    result[snakeKey] = val;
  }
  return result;
};

const pipelineDisplayKey = `${APP_KEY}_pipelineDisplayKey`;

export const setPipelineDisplayFlag = (flag: boolean) =>
  SDKPromise().then((sdk) =>
    sdk.storage.setItem(pipelineDisplayKey, flag ? "true" : "false")
  );

export const getPipelineDisplayFlag = () =>
  SDKPromise().then(async (sdk) => {
    const result = await sdk.storage.getItem(pipelineDisplayKey);
    return result === "true";
  });

export const hasUndefined = (arr: any[]) =>
  arr.some((item) => typeof item === "undefined");

export const getUserKey = async (): Promise<string> => {
  const context = await sdk.Context.load().catch((e) => handleErrorMsg(e));
  return context?.loginUser.id || "";
};
