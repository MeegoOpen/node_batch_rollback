import React, { useCallback, useRef, useState } from "react";
import { Tooltip } from "@douyinfe/semi-ui";
import { fetchFlowNodes2 } from "../../api/services";
import AsyncFormCascaderSelect from "./AsyncFormCascaderSelect";
import sdk from "../../sdk";

export enum FlowType {
  WORK_FLOW = 1,
  STATE_FLOW,
}

export const SEPARATOR = "#&#";

const FlowNodeStateTreeSelect = (props) => {
  const {
    spaceId,
    workObjId,
    flowType = FlowType.WORK_FLOW,
    formApi,
    onOk,
    field,
    onChangeByOptions,
    disabledKeyMap,
    getAllTemplateList,
    ...rest
  } = props;
  const cacheDataByTemp = useRef<Record<string, any[]>>({});
  const [placeholder, setPlaceholder] = useState("请选择流程节点");

  const fetchData = useCallback(
    async (level = 1, curOptionItem) => {
      if (!spaceId || !workObjId) {
        return [];
      }
      const flowAndTemplateIds = formApi?.getValue("flowAndTemplateIds") ?? [];

      return new Promise(async (resolve) => {
        const templateList = await getAllTemplateList();
        if (level === 1) {
          const selectedNodeId = formApi?.getValue(field)?.[1];
          if (selectedNodeId) {
            const tplNodesArr = await Promise.all(
              flowAndTemplateIds.map((templateId) =>
                fetchFlowNodes2(spaceId, workObjId, Number(templateId), "workflow")
              )
            );
            const tplNodesObj = tplNodesArr.reduce((obj, tplNodes, i) => {
              obj[flowAndTemplateIds[i]] = tplNodes;
              return obj;
            }, {} as Record<string, any>);
            const options = templateList.map((tpl) => ({
              label: tpl.name,
              key: String(tpl.id),
              value: String(tpl.id),
              children: (tplNodesObj[tpl.id] ?? [])
                .filter(({ type }) => !(type === 1))
                .map((node) => ({
                  label: node.name,
                  key: `${tpl.id}${SEPARATOR}${node.key}`,
                  value: `${tpl.id}${SEPARATOR}${node.key}`,
                  isLeaf: true,
                  disabled: disabledKeyMap?.[`${tpl.id}${SEPARATOR}${node.key}`],
                })),
            }));
            const selectedTemplateId = formApi?.getValue(`${field}`)?.[0];
            onChangeByOptions?.(
              options.find((item) => item.key === selectedTemplateId)?.children ?? []
            );
            resolve(options);
            return;
          }
          resolve(
            templateList.map((tpl) => ({
              label: tpl.name,
              key: String(tpl.id),
              value: String(tpl.id),
            }))
          );
          return;
        }

        const { value: templateId } = curOptionItem;
        const tplNodes = await fetchFlowNodes2(
          spaceId,
          workObjId,
          Number(templateId),
          flowType === FlowType.WORK_FLOW ? "workflow" : "stateflow"
        );
        const options = tplNodes
          .filter(({ type }) => !(type === 1))
          .map((node) => ({
            label: node.name,
            key: `${templateId}${SEPARATOR}${node.key}`,
            value: `${templateId}${SEPARATOR}${node.key}`,
            isLeaf: true,
            disabled: disabledKeyMap?.[`${templateId}${SEPARATOR}${node.key}`],
          }));
        if (!options.length) {
          sdk.toast.warning("当前模板未配置非自动完成节点。");
        }
        if (!cacheDataByTemp.current[templateId]) {
          cacheDataByTemp.current[templateId] = options;
        }
        onOk?.(cacheDataByTemp.current);
        resolve(options);
      });
    },
    [disabledKeyMap, field, flowType, formApi, getAllTemplateList, onChangeByOptions, onOk, spaceId, workObjId]
  );

  return (
    <AsyncFormCascaderSelect
      maxTagCount={3}
      field={field}
      className="flow-node-state-tree"
      multiple={false}
      disableStrictly
      leafOnly
      labelEllipsis
      showRestTagsPopover
      ignoreParentValue
      disabledRender={(opt) => (
        <Tooltip content="该选项已被其它规则使用">{opt.label}</Tooltip>
      )}
      restTagsPopoverProps={{
        showArrow: false,
        style: {
          maxWidth: 300,
          minHeight: 40,
          maxHeight: 400,
          overflowY: "auto",
          padding: 10,
        },
      }}
      onLoadingChange={(loading) =>
        setPlaceholder(loading ? "加载中…" : "选择流程及节点")
      }
      onChangeByOptions={onChangeByOptions}
      placeholder={placeholder}
      fetchData={fetchData}
      filterTreeNode
      onlyDisplayNodePath
      {...rest}
    />
  );
};

export default FlowNodeStateTreeSelect;
