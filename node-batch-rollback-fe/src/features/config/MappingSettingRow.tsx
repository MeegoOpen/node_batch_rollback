import React, { useEffect, useMemo, useState } from "react";
import { Button, Form } from "@douyinfe/semi-ui";
import { IconArrowRight } from "@douyinfe/semi-icons";
import FlowNodeStateTreeSelect, { SEPARATOR } from "./FlowNodeStateTreeSelect";
import { fetchFlowNodes2 } from "../../api/services";

interface MappingOption {
  key: string;
  value: string;
  label: string;
  name?: string;
  type?: number;
  isLeaf?: boolean;
  children?: MappingOption[];
}

interface TemplateOption {
  id: string | number;
  name: string;
}

const MappingSettingRow = ({
  arrayField,
  spaceId,
  formApi,
  workObjId,
  disabledKeyMap,
  getAllTemplateList,
}) => {
  const { field, remove, key } = arrayField;
  const [options, setOptions] = useState<any[]>([]);

  const flowAndTemplateIds: string[] = formApi?.getValue("flowAndTemplateIds") ?? [];
  const flowAndTemplateIdsKey = useMemo(
    () => flowAndTemplateIds.join(","),
    [flowAndTemplateIds]
  );

  useEffect(() => {
    if (flowAndTemplateIds.length === 0) {
      return;
    }
    Promise.all(
      flowAndTemplateIds.map((templateId) =>
        fetchFlowNodes2(spaceId, workObjId, Number(templateId), "workflow")
      )
    ).then(async (tplNodesArr) => {
      const tplNodesObj = tplNodesArr.reduce((obj, tplNodes, index) => {
        obj[flowAndTemplateIds[index]] = tplNodes;
        return obj;
      }, {} as Record<string, any>);
      const allTemplateList = await getAllTemplateList();
      const nextOptions = allTemplateList.map((tpl: TemplateOption): MappingOption => ({
        label: tpl.name,
        key: String(tpl.id),
        value: String(tpl.id),
        children: (tplNodesObj[tpl.id] ?? [])
          .filter(({ type }: MappingOption) => !(type === 1))
          .map((node: MappingOption) => ({
            label: node.name ?? node.label,
            key: `${tpl.id}${SEPARATOR}${node.key}`,
            value: `${tpl.id}${SEPARATOR}${node.key}`,
            isLeaf: true,
          })),
      }));
      const selectedTemplateId = formApi?.getValue(`${field}.source`)?.[0];
      const nextChildren =
        nextOptions.find((item: MappingOption) => item.key === selectedTemplateId)?.children ?? [];
      setOptions((prev) =>
        JSON.stringify(prev) === JSON.stringify(nextChildren) ? prev : nextChildren
      );
    });
  }, [field, flowAndTemplateIdsKey, formApi, getAllTemplateList, spaceId, workObjId]);

  return (
    <div key={`${key}_row`} className="mapping-setting-row-inner">
      <div className="mapping-setting-row-source">
        <FlowNodeStateTreeSelect
          key={`${key}_node_state_tree_select`}
          noLabel
          field={`${field}.source`}
          spaceId={spaceId}
          workObjId={workObjId}
          formApi={formApi}
          onOk={() => {}}
          onChangeByOptions={(values: MappingOption[]) => {
            if (values.length === 0) {
              return;
            }
            setOptions(values);
          }}
          style={{ width: "100%" }}
          disabledKeyMap={disabledKeyMap}
          getAllTemplateList={getAllTemplateList}
        />
      </div>
      <div className="mapping-setting-row-arrow">
        <IconArrowRight
          style={{
            fontSize: 16,
            color: "var(--semi-color-disabled-text)",
          }}
        />
      </div>
      <div className="mapping-setting-row-target">
        <Form.Select
          key={`${key}_select`}
          noLabel
          field={`${field}.target`}
          placeholder="选择回滚节点"
          getPopupContainer={() => document.body}
          optionList={options.map((item) => ({
            ...item,
            disabled: formApi?.getValue(`${field}.source`)?.[1] === item.key,
          }))}
        />
      </div>
      <div className="mapping-setting-row-action">
        <Button onClick={remove} theme="borderless" type="danger">
          删除
        </Button>
      </div>
    </div>
  );
};

export default MappingSettingRow;
