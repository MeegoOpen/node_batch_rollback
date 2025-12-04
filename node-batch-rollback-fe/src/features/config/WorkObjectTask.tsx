import { Typography, Form, Card, Button, Tooltip, ArrayField } from "@douyinfe/semi-ui";
import type { FormApi } from "@douyinfe/semi-ui/lib/es/form";
import type { SelectProps } from "@douyinfe/semi-ui/lib/es/select";
import { IconDelete, IconPlusCircle, IconInfoCircle } from "@douyinfe/semi-icons";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { getFieldsList } from "../../api/services";
import sdk from "../../sdk";
import "./config.less";

const defaultMap = [
  {
    label: "操作人",
    type: ["user"],
    value: "operator",
  },
  {
    label: "驳回原因",
    type: ["text"],
    value: "reason",
  },
  {
    label: "操作时间",
    type: ["date"],
    value: "operate_time",
  },
  {
    label: "操作节点名称",
    type: ["text"],
    value: "operate_node",
  },
  {
    label: "节点的开始时间",
    type: ["date"],
    value: "start_time",
  },
];
/**
 * 分批处理数组元素并发送请求
 * @param {Array} items - 需要处理的数组
 * @param {number} batchSize - 每批处理的元素数量
 * @param {Function} requestHandler - 处理每批元素的请求函数，应返回Promise
 * @returns {Promise} - 当所有批次请求完成后resolve的Promise，包含所有结果
 */
const batchRequestSender = async (items, batchSize, requestHandler, params) => {
  const results: any[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, items.length);
    const batchItems = items.slice(startIndex, endIndex);
    const batchResult = await requestHandler(batchItems, batchIndex, params);
    results.push(...batchResult);
  }
  return results;
};
const WorkItemTask = (props: {
  spaceId: string;
  formApi: FormApi;
  refresh: () => void;
}) => {
  const { spaceId, formApi, refresh } = props;
  const [woList, setWoList] = useState<SelectProps["optionList"]>([]);
  const [fieldsMap, setFieldsMap] = useState(new Map());
  const firstLoadFlag = useRef(true);

  useEffect(() => {
    if (!formApi || !spaceId) {
      return;
    }
    if (!firstLoadFlag.current) {
      return;
    }
    const configList = formApi.getValue("list");
    if (configList?.length) {
      const filterList = configList?.filter((item) => item.work_item_type_key);
      const list = filterList.map((item) =>
        getWorkItemFields(spaceId, item.work_item_type_key)
      );
      firstLoadFlag.current = false;
      Promise.all(list).then((res) => {
        setFieldsMap((prev) => {
          const newMap = new Map(prev);
          res.forEach((item, index) => {
            newMap.set(filterList[index].work_item_type_key, item);
          });
          return newMap;
        });
      });
    }
  }, [formApi, spaceId]);

  useEffect(() => {
    if (!spaceId) {
      return;
    }
    sdk.Space.load(spaceId)
      .then(async (space) => {
        const _originDatas = await batchRequestSender(
          space.enabledWorkObjectList,
          15,
          async (batchItems, batchIndex, param) => {
            return new Promise(async (resolve) => {
              setTimeout(async () => {
                const result = await Promise.all(
                  batchItems.map(async ({ id }) => {
                    const wo = await sdk.WorkObject.load({
                      ...param,
                      workObjectId: id,
                    });
                    return {
                      label: wo.name,
                      value: wo.id,
                      flowMode: wo.flowMode,
                    };
                  })
                );
                resolve(result);
              }, 200);
            });
          },
          {
            spaceId: spaceId,
          }
        );
        setWoList(_originDatas.filter((i) => i.flowMode === "workflow"));
      })
      .catch((e) => {
        console.log("load space failed", e);
      });
  }, [spaceId]);

  const handleWorkObjChange = useCallback(
    async (field: string, value: any) => {
      formApi.setValue(`${field}.rollback_record`, undefined);
      formApi.setValue(`${field}.operator`, undefined);
      formApi.setValue(`${field}.reason`, undefined);
      formApi.setValue(`${field}.operate_time`, undefined);
      formApi.setValue(`${field}.operate_node`, undefined);
      formApi.setValue(`${field}.start_time`, undefined);
      if (value) {
        const fieldsList = await getWorkItemFields(spaceId, value);
        setFieldsMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(value, fieldsList);
          return newMap;
        });
      }
    },
    [spaceId, formApi]
  );

  const getWorkItemFields = useCallback(async (spaceId, workObjectId) => {
    try {
      const res = await getFieldsList({
        project_key: spaceId,
        work_item_type_key: workObjectId,
      });
      return (res || []).map((item) => ({
        ...item,
        label: item.field_name,
        value: item.field_key,
      }));
    } catch (error) {
      return [];
    }
  }, []);

  const getWorkObjStatus = (
    fieldsMap,
    field,
    rollbackRecordFieldKey,
    fieldType
  ) => {
    if (
      rollbackRecordFieldKey &&
      fieldsMap.get(formApi.getValue(`${field}.work_item_type_key`))
    ) {
      return (
        fieldsMap
          .get(formApi.getValue(`${field}.work_item_type_key`))
          .find((item) => item.value === rollbackRecordFieldKey)
          ?.compound_fields ?? []
      )
        ?.filter((item) => fieldType.includes(item.field_type_key))
        ?.map((item) => ({
          label: item.field_name,
          value: item.field_key,
          type: item.field_type_key,
        }));
    }
    return [];
  };

  return (
    <ArrayField field="list" initValue={[]}>
      {({ add, arrayFields }) => (
        <React.Fragment>
          {arrayFields.length === 0 && (
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="tertiary">暂无数据</Typography.Text>
            </div>
          )}
          {arrayFields.map(({ field, key, remove }, idx) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <Card style={{ flex: 1 }} headerExtraContent={null}>
                <Form.Select
                  label="适用工作项"
                  placeholder="待填"
                  field={`${field}.work_item_type_key`}
                  optionList={woList}
                  onChange={(value) => {
                    handleWorkObjChange(field, value);
                  }}
                />
                <div className="feature-wrap">
                  <div
                    className="feature-wrap-header"
                    style={{ display: "inline-flex" }}
                  >
                    <div
                      className="feature-wrap-header-left"
                      style={{ width: 190, paddingLeft: 10 }}
                    >
                      驳回记录字段
                    </div>
                  </div>
                  <Form.Select
                    noLabel
                    placeholder="待填"
                    field={`${field}.rollback_record`}
                    optionList={fieldsMap
                      .get(formApi.getValue(`${field}.work_item_type_key`))
                      ?.filter(
                        (item) => item.field_type_key === "compound_field"
                      )}
                  />
                  <div className="feature-wrap-children">
                    {defaultMap.map((item) => (
                      <Form.Select
                        showClear
                        label={item.label}
                        field={`${field}.${item.value}`}
                        optionList={getWorkObjStatus(
                          fieldsMap,
                          field,
                          formApi.getValue(`${field}.rollback_record`),
                          item.type
                        )}
                      />
                    ))}
                  </div>
                </div>
              </Card>
              <Button
                style={{ marginLeft: 12 }}
                theme={"solid"}
                type={"danger"}
                icon={<IconDelete />}
                onClick={() => {
                  remove();
                  refresh();
                }}
              />
            </div>
          ))}
          <Button
            style={{ marginTop: 12 }}
            icon={<IconPlusCircle />}
            onClick={add}
          >
            添加一组规则
          </Button>
        </React.Fragment>
      )}
    </ArrayField>
  );
};

export default memo(WorkItemTask);
