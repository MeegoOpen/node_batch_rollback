import axios from "axios";
import { type FieldTypeKey, requestHost } from "../constants";
import request, { limitGet, limitPost, limitPut } from "./request";
import { getUserKey } from "../utils";
export interface ResponseWrap<D> {
  code: number;
  err_code:number;
  err_msg:string;
  msg: string;
  data: D;
  error?: {
    id: number;
    localizedMessage: {
      locale: string;
      message: string;
    };
  };
}

interface ResWrapper<T = Record<string, unknown>> {
  message: string;
  statusCode: number;
  data: T;
}


export interface FlowNode2 {
  key: string;
  name: string;
  type: number; // 1-auto finish, 2-not auto finish
}
// 没有 QPS 限制的接口
export const fetchFlowNodes2 = (
  projectKey: string,
  _workItemType: string,
  templateId: number,
  flowType: "workflow" | "stateflow"
) => {
  void _workItemType;
  return limitGet<
    unknown,
    Omit<ResponseWrap<FlowNode>, "data"> & {
      data: FlowNode;
      err_code: number;
    }
  >(`/proxy/open_api/${projectKey}/template_detail/${templateId}`).then((res) => {
    if (res.err_code !== 0 || typeof res.data !== "object") {
      return [];
    }
    if (flowType === "workflow") {
      return (res.data.workflow_confs ?? []).map((node) => ({
        key: node.state_key,
        name: node.name,
        type: node.pass_mode,
      }));
    }
    return (res.data.state_flow_confs ?? []).map((node) => ({
      key: node.state_key,
      name: node.name,
      type: node.state_type,
    }));
  });
};
/**
 * 节点状态，1：未开始，2：进行中，3：已完成
 */
export enum INodeStatus {
  NotStart = 1,
  Doing = 2,
  Done = 3,
}

export interface ISchedules {
  estimate_end_date: number;
  estimate_start_date: number;
  owners: string[];
  points: number;
}
export interface ISubtasks {
  id: string;
  name: string;
  order: number;
  owners: string[];
  schedules: Array<ISchedules>;
}
export interface IWorkflowDetail {
  connections: {
    source_state_key: string;
    target_state_key: string;
  }[];
  workflow_nodes: Array<{
    id: string;
    state_key: string;
    name: string;
    status: INodeStatus;
    node_schedule: ISchedules;
    owners: string[];
    milestone: boolean;
    sub_tasks: Array<ISubtasks>;
  }>;
}
// 获取工作流详情
export const fetchWorkflowDetail = (
  projectKey: string,
  workItemKey: string,
  workItemId: number
) =>
  limitPost<unknown, ResponseWrap<IWorkflowDetail>>(
    `/proxy/open_api/${projectKey}/work_item/${workItemKey}/${workItemId}/workflow/query`,
    {
    }
  );
export interface StateflowConfig {
  authorized_roles: string[];
  name: string;
  state_key: string;
  state_type: number;
}

interface Connection {
  source_state_key: string;
  target_state_key: string;
  transition_id?: number;
}

export enum DisabledState {
  Disabled = 1,
  Enabled,
}
export enum NodePassMode {
  AUTO_FINISH = 1,
  SINGLE_CONFIRM,
  MULTIPLE_CONFIRM,
}
export interface WorkflowConfig {
  deletable: boolean;
  deletable_operation_role: string[];
  different_schedule: boolean;
  done_allocate_owner: boolean;
  done_operation_role: string[];
  done_schedule: boolean;
  is_limit_node: boolean;
  name: string;
  need_schedule: boolean;
  owner_roles: string[];
  owner_usage_mode: number;
  owners: string[];
  pass_mode: NodePassMode;
  state_key: string;
  tags: string[];
  visibility_usage_mode: number;
}
export interface FlowNode {
  template_id: number;
  template_name: string;
  version: number;
  is_disabled: DisabledState;
  state_flow_confs: StateflowConfig[] | null;
  workflow_confs: WorkflowConfig[] | null;
  connections: Connection[];
}

export const fetchFlowNodes = (projectKey: string, templateId: string) =>
  limitGet<
    unknown,
    Omit<ResponseWrap<any>, "data"> & {
      data: FlowNode;
      err_code: number;
    }
  >(
    `/proxy/open_api/${projectKey}/template_detail/${templateId}`,
    
  ).then((res) => {
    // 后端接口结构发生了变化，导致多处报错，这里统一处理一下
    if (typeof res.data === "object") {
      if (!Array.isArray(res.data.state_flow_confs)) {
        res.data.state_flow_confs = [];
      }
      if (!Array.isArray(res.data.workflow_confs)) {
        res.data.workflow_confs = [];
      }
    }
    return res;
  });
/**
 * 登陆鉴权
 * @param data
 * @returns
 */
export const submitNodeRollback = ({
  projectKey,
  workItemKey,
  workItemId,
  nodeId,
  rollbackReason,
}: {
  projectKey: string;
  workItemKey: string;
  workItemId: number;
  nodeId: string;
  rollbackReason: string;
}) => {
  return limitPost<
    unknown,
    ResponseWrap<{
      code: number;
      data: any;
    }>
  >(`/proxy/open_api/${projectKey}/workflow/${workItemKey}/${workItemId}/node/${nodeId}/operate`, { 
    action: "rollback",
    rollback_reason: rollbackReason,
  });
};

export interface FieldOption {
  children?: FieldOption[];
  super_masters?: string[];
  id: string;
  name: string;
}

// 获取工作流详情
export const fetchProject = (projectKey: string) =>
  limitPost<
    unknown,
    ResponseWrap<{
      data: any;
      err_code: number;
    }>
  >(`/proxy/open_api/projects/detail`, {
    project_keys: [projectKey],
    user_key:getUserKey(),
  });

// 获取工作流详情
export const fetchBusiness = (projectKey: string) =>
limitGet<unknown, ResponseWrap<FieldOption[]>>(
  `/proxy/open_api/${projectKey}/business/all`,
    
  );
export interface FieldOptionItem {
  children?: FieldOptionItem[] | null;
  label: string;
  value: string;
  work_item_type_key?: string;
}
export interface FieldItem {
  compound_fields: FieldItem[] | null;
  field_alias: string;
  field_key: string;
  field_name: string;
  field_type_key: string;
  is_custom_field: boolean;
  is_obsoleted: boolean;
  options: FieldOptionItem[];
  relation_id: string;
  value_generate_mode: string;
  work_item_scopes: any;
}
// 获取字段列表
export function getFieldsList(params: {
  project_key: string;
  work_item_type_key: string;
}) {
  return request
    .post<unknown, ResWrapper<FieldItem[]>>(
      `/proxy/open_api/${params.project_key}/field/all`,
      params
    )
    .then((res) => res.data);
}

export interface IConfigItem {
  id: number; //配置id
  project_key: string;
  enable: number; //0未启用1启用
  button_label: string; //按钮匹配文字
  work_item_type_key: string; //驳回记录工作项类型
  rollback_record: string; //驳回记录fieldKey（复合字段）
  operator: string; //操作人fieldKey
  reason: string; //驳回原因fieldKey
  operate_time: string; //操作时间fieldKey
  operate_node: string; //操作节点fieldKey
  start_time: string; //节点开始时间fieldKey
  condition?: string; // 审批节点条件配置
}

// 获取配置
export const fetchConfig = (projectKey: string) =>
  request.get<
    unknown,
    ResponseWrap<{
      list: IConfigItem[];
    }>
  >("/api/v1/node-operator/settings", {
    params: {
      project_key: projectKey,
    },
  });

export const saveConfig = ({
  list,
  project_key,
}: {
  list: IConfigItem;
  project_key: string;
}) =>
  limitPost<unknown, ResponseWrap<FieldOption[]>>(
    "/api/v1/node-operator/settings",
    {
      list,
      project_key,
    }
  );

export type CompoundValues = { field_key: string; field_value: any }[][];

interface IParam {
  projectKey: string;
  workItemType: string;
  workItemId: number;
  updateFields: [
    {
      field_key: string;
      field_value: CompoundValues;
    }
  ];
}

export const updateChangeField = ({
  projectKey,
  workItemType,
  workItemId,
  updateFields,
}: IParam) =>
  limitPut<unknown, ResponseWrap<any>>(
    `/proxy/open_api/${projectKey}/work_item/${workItemType}/${workItemId}`,
    {
      update_fields: updateFields,
    }
  );

export interface SuggestionConclusionResult {
  key: string;
  label: string;
  origin_label: string;
}

export interface SuggestionInfo {
  node_id: string;
  summary_mode: string;
  opinion: {
    finished_opinion_result: string;
    owners_finished_opinion_result: Array<{
      owner: string;
      finished_opinion_result: string;
    }>;
  };
  conclusion: {
    finished_conclusion_result: SuggestionConclusionResult;
    owners_finished_conclusion_result: Array<{
      owner: string;
      finished_conclusion_result: SuggestionConclusionResult;
    }>;
  };
}

export interface SuggestionResponseData {
  project_key: string;
  work_item_id: string | number;
  finished_infos: SuggestionInfo[];
}

export const getSuggestion = (
  projectKey: string,
  workItemId: number,
  nodeId: string
) =>
  limitPost<unknown, ResponseWrap<SuggestionResponseData>>(
    "/proxy/open_api/work_item/finished/batch_query",
    {
      project_key: projectKey,
      work_item_id: workItemId,
      node_ids: [nodeId],
    }
  );

export interface UpdateSuggestionParams {
  project_key: string;
  work_item_id: number;
  node_id: string;
  opinion: string;
  finished_conclusion_option_key: string;
  operation_type: "owner" | "node";
}

export const updateSuggestion = (params: UpdateSuggestionParams) =>
  limitPost<unknown, ResponseWrap<Record<string, never>>>(
    "/proxy/open_api/work_item/finished/update",
    params
  );

interface WorkItemDetailReq {
  project_key: string;
  work_item_type_key: string;
  work_item_ids: number[];
  expand?: {
    need_workflow: boolean; // 是否返回工作流信息
    need_multi_text: boolean; // 是否返回富文本
    need_user_detail: boolean; // 是否返回用户详情
    need_sub_task_parent: boolean; // 是否返回子任务相关信息
    relation_fields_detail: boolean; // 是否返回关联字段详情
  };
}
interface IRes {
  data: {
    field_value: string;
    field_key: string;
  };
}

export const getWorkItemFieldDetail = async (params: WorkItemDetailReq) =>
  limitPost<unknown, ResponseWrap<IRes>>(
    `/proxy/open_api/${params.project_key}/work_item/${params.work_item_type_key}/query`,
    params
  )
    .then((res) => {
      if (res?.err_code === 0) {
        return res?.data;
      }
    })
    .catch((err) => {
      return {};
    });
