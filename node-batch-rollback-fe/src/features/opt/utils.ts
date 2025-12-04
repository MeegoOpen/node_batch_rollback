import {
  fetchWorkflowDetail,
  fetchFlowNodes,
  fetchProject,
  NodePassMode,
  INodeStatus,
  fetchBusiness,
  type FieldOption,
} from "../../api/services";
import sdk from "../../sdk";
import { getActiveWorkItem } from "../../utils";

const getUserKeyListsByRole = (
  roleList: string[],
  curUserKey,
  // roleUserKeys,
  // nodeUserKeys,
  administrators,
  superAdministrators,
  curNodeId
) => {
  if (administrators.concat(superAdministrators).includes(curUserKey)) {
    return true;
  }
  let checkHas = false;
  for (const item of roleList) {
    switch (item) {
      // 任何人
      case "_anybody": {
        checkHas = true;
        break;
      }
      // 节点负责人
      // case "_node_owner":
      //   {
      //     checkHas =
      //       Array.isArray(nodeUserKeys[item]) &&
      //       roleUserKeys[curNodeId].includes(curUserKey);
      //   }
      //   break;
      // 管理员
      case "_space_manager":
        {
          checkHas =
            Array.isArray(administrators) &&
            administrators.includes(curUserKey);
        }
        break;
        // default:
        //   {
        //     checkHas =
        //       Array.isArray(roleUserKeys[item]) &&
        //       roleUserKeys[item].includes(curUserKey);
        //   }
        break;
    }
    if (checkHas) {
      break;
    }
  }
  return checkHas;
};

export const getMatchedNodeLists = async ({
  projectKey,
  workItemType,
  workItemId,
  templateId,
  curUserKey,
}) => {
  const [workflowRes, templateRes] = await Promise.all([
    fetchWorkflowDetail(projectKey, workItemType, workItemId),
    fetchFlowNodes(projectKey, templateId),
  ]);
  const { err_code, data } = templateRes;

  const { err_code: workflowCode, data: workflowData } = workflowRes;
  if (err_code === 0 && workflowCode === 0) {

    let administrators: string[] = [];
    let superAdministrators: string[] = [];
    if (data.workflow_confs?.some((i) => i.is_limit_node)) {
      const [prjectDetailRes, businessRes] = await Promise.all([
        fetchProject(projectKey),
        fetchBusiness(projectKey),
      ]);
      administrators = prjectDetailRes?.data[projectKey]?.administrators ?? [];
      const superAdministratorsObj = getMapByLists(businessRes.data);
      superAdministrators =
        superAdministratorsObj &&
        Object.values(superAdministratorsObj).reduce((preVal, curVal) =>
          preVal.concat(curVal)
        );
    }
    const list = data.workflow_confs?.filter((i) => {
      return (
        workflowData.workflow_nodes.find((j) => j.state_key === i.state_key)
          ?.status === INodeStatus.Done &&
        (i.is_limit_node
          ? administrators.concat(superAdministrators).includes(curUserKey)
          : true) &&
        i.pass_mode !== NodePassMode.AUTO_FINISH
      );
    });
    return {list, workflowData:  workflowData.workflow_nodes};
  }
  return {list: [], workflowData: []};
};

export const getMapByLists = (lists: FieldOption[]) => {
  if (!lists) {
    return;
  }
  const listMaps: Record<string, any> = {};
  const recursiveMap = (item: FieldOption) => {
    listMaps[item.id] = item.super_masters ?? [];
    if ("children" in item) {
      item.children?.forEach((child) => {
        recursiveMap(child);
      });
    }
  };
  lists.forEach((item) => {
    recursiveMap(item);
  });
  return listMaps;
};
