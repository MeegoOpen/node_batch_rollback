import { type SDKClient } from "@lark-project/js-sdk";

// 此处为了兼容1.0获取sdk的写法
export const SDKPromise = (): Promise<SDKClient> => {
  return Promise.resolve(window.JSSDK);
};

export default window.JSSDK;
