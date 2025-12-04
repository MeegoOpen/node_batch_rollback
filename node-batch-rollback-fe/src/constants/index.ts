import pluginConfig from "../../plugin.config.json";
import { getStorage } from "../utils";
import sdk from "../sdk";

export const { pluginId: APP_KEY, siteDomain ,OpenAPIHost} = pluginConfig;
export const requestHost = siteDomain;
export const apiHost = OpenAPIHost;


export const shouldUseMock = false;


export type FieldTypeKey = keyof typeof FIELD_TYPE_NAME;

export const FIELD_TYPE_NAME = {
  text: "文本",
  multi_pure_text: "多行文本",
  link: "链接",
  date: "日期",
  schedule: "日期区间",
  precise_date: "日期+时间",
  number: "数字",
  work_item_related_select: "关联工作项",
  work_item_related_multi_select: "多选关联工作项",
  signal: "信号",
  bool: "开关",
  radio: "单选按钮",
  select: "单选",
  multi_select: "多选",
  tree_select: "级联单选",
  tree_multi_select: "级联多选",
  user: "单选人员",
  multi_user: "多选人员",
  compound_field: "复合字段",
  multi_text: "富文本",
  file: "文件",
  multi_file: "附件",
  aborted: "终止",
  deleted: "删除",
  role_owners: "角色人员",
  linked_work_item: "关联工作项",
  business: "业务线",
  chat_group: "群id",
  group_id: "群id",
  group_type: "拉群方式",
  work_item_template: "模板类型",
  approver_user: "审批人",
};

export const DEVICE_TYPE_KEY = `${APP_KEY}_device_type`;

let host = "";
export const getRequestHost = async () => {
  if (host) {
    return host;
  }
  // 移动端不支持sdk.navigation.getHref()
  const deviceType = await getStorage(DEVICE_TYPE_KEY);
  // 手机端需要写成try{}catch{}
  if (deviceType === "mobile") {
    try {
      await sdk.navigation
        .getHostname()
        .then((href) => {
          host = `//${href}`;
        })
        .catch((err) => {
          host = siteDomain;
        });
    } catch (err) {
      host = siteDomain;
    }
    return host;
  }
  await sdk.navigation
    .getHref()
    .then((href) => {
      host = new URL(href)?.origin;
    })
    .catch((err) => {
      host = siteDomain;
    });
  return host;
};
