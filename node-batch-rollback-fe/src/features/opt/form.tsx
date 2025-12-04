import React, { useEffect, useMemo, useState } from "react";
import { Form, Button, Row, Col, Checkbox, Spin, Skeleton } from "@douyinfe/semi-ui";
import moment from "moment";
import { type FormApi } from "@douyinfe/semi-ui/lib/es/form";
import "./index.less";
import {
  submitNodeRollback,
  type WorkflowConfig,
  updateChangeField,
  fetchConfig,
  getWorkItemFieldDetail,
  type IConfigItem,
  type CompoundValues,
} from "../../api/services";
import sdk from "../../sdk";
import { getMatchedNodeLists } from "./utils";
import { type WorkItemButtonFeatureContext } from "@lark-project/js-sdk";
import { getButtonContext } from "../../utils";

const OptForm = (props) => {
  const [rollbackRecordLoading, setRollbackRecordLoading] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();
  const [checkedList, setCheckedList] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckall] = useState(false);
  const [nodeList, setNodeList] = useState<WorkflowConfig[]>([]);
  const [loading, toggleLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [activeWorkItem, setActiveWorkItem] =
    useState<WorkItemButtonFeatureContext>();
  const [loginUser, setLoginUser] = useState("");
  const [originValue, setOriginValue] = useState<any[]>([]);
  const [workflowList, setWorkflowList] = useState<any[]>([]);
  const [config, setConfig] = useState<IConfigItem>();
  const [error, setError] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, string>>({});
  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? nodeList.map((i) => i.state_key) : []);
    setIndeterminate(false);
    setCheckall(e.target.checked);
  };
  const onChange = (checkedList) => {
    setCheckedList(checkedList);
    setIndeterminate(
      !!checkedList.length && checkedList.length < nodeList.length
    );
    setCheckall(checkedList.length === nodeList.length);
  };

  useEffect(() => {
    setRollbackRecordLoading(true);
    sdk.Context.load().then(async ({ loginUser }) => {
      const buttonContext =
        (await getButtonContext()) as WorkItemButtonFeatureContext;
      console.info("SDKGetButtonContext", JSON.stringify(buttonContext));
      if (buttonContext?.workItemId) {
        setListLoading(true);
        setActiveWorkItem(buttonContext);
        setLoginUser(loginUser.id);
        const { workItemId: id, workObjectId, spaceId } = buttonContext;
        try {
          const wi = await sdk.WorkItem.load({
            spaceId,
            workItemId: id,
            workObjectId,
          });

          const fieldRes = await getWorkItemFieldDetail({
            project_key: spaceId,
            work_item_type_key: workObjectId,
            work_item_ids: [id],
            expand: {
              need_workflow: false, // 是否返回工作流信息
              need_multi_text: true, // 是否返回富文本
              need_user_detail: false, // 是否返回用户详情
              need_sub_task_parent: false, // 是否返回子任务相关信息
              relation_fields_detail: false, // 是否返回关联字段详情
            },
          });
          getMatchedNodeLists({
            projectKey: spaceId,
            workItemType: workObjectId,
            workItemId: id,
            templateId: wi.templateId,
            curUserKey: loginUser.id,
          })
            .then((res) => {
              setListLoading(false);
              res.list?.length && setNodeList(res.list);
              res.workflowData?.length && setWorkflowList(res.workflowData);
            })
            .catch(() => {
              setListLoading(false);
            });
          const configConf = await fetchConfig(spaceId);
          let _configConf = {} as IConfigItem;
          if (configConf.err_code === 0) {
            _configConf =
              configConf.data.list.filter(
                (i) => i.work_item_type_key === workObjectId
              )?.[0] ?? {};
            setConfig(_configConf);
            const field = fieldRes?.[0].fields.find(
              (i) => i.field_key === _configConf.rollback_record
            );
            setOriginValue(field.field_value);
          }
          setRollbackRecordLoading(false);
        } catch (err) {
          console.error("err", err);
          setRollbackRecordLoading(false);
        }
      }
    });
  }, []);

  const message = "该项为必填项";
  const cancel = () => {
    (sdk.containerModal as any).closeModal();
  };

  const submit = () => {
    formApi
      ?.validate()
      .then(async (values) => {
        const error = {};
        const success = {};
        let loopNumber = 0;
        const requestList = [...checkedList];
        requestList.forEach(async (i, idx) => {
          toggleLoading(true);
          if (activeWorkItem) {
            const { workItemId: id, spaceId, workObjectId } = activeWorkItem;
            const res = await submitNodeRollback({
              projectKey: spaceId,
              workItemKey: workObjectId,
              workItemId: id,
              nodeId: i,
              rollbackReason: values.rollbackReason,
            });
            if (res.err_code !== 0) {
              error[i] = res.err_msg || "驳回失败";
            } else {
              success[i] = 1;
              const findIndex = checkedList.findIndex((j) => j === i);
              checkedList.splice(findIndex, 1);
            }
            loopNumber++;
          }
          if (loopNumber === requestList.length) {
            setSuccess(success);
            if (Object.keys(error).length) {
              setError(error);
            } else {
              sdk.toast.success("驳回成功");
              if (config?.work_item_type_key) {
                await updateOptValue(values.rollbackReason);
              }
              if (!isMobile) {
                (sdk.containerModal as any).closeModal();
              }
              toggleLoading(false);

              setCheckedList([]);
              formApi?.reset();
            }
          }
        });
      })
      .catch((err) => {
        console.error("err", err);
      });
  };

  const convertData = (
    currentValue: { field_key: string; field_value: any }[],
    config: IConfigItem,
    originValue: { field_key: string; field_value: any }[][] = []
  ): [
      {
        field_key: string;
        field_value: CompoundValues;
      }
    ] => {
    const newData = [
      {
        field_key: config.rollback_record,
        field_value: [
          ...originValue.map((i) =>
            i
              .map((childrenI) => ({
                field_key: childrenI.field_key,
                field_value: childrenI.field_value,
              }))
              .filter((j) => j.field_key !== "group_uuid")
          ),
          currentValue,
        ],
      },
    ] as [
        {
          field_key: string;
          field_value: CompoundValues;
        }
      ];
    return newData;
  };

  const updateOptValue = (reason: string) => {
    if (activeWorkItem && config) {
      const { workItemId: id, workObjectId, spaceId } = activeWorkItem;
      const nodeObj = workflowList.find(
        (i) => i.state_key === activeWorkItem?.nodeId
      );
      return updateChangeField({
        projectKey: spaceId,
        workItemType: workObjectId,
        workItemId: id,
        updateFields: convertData(
          [
            {
              field_key: config.operator,
              field_value: loginUser,
            },
            {
              field_key: config.operate_time,
              field_value: moment().valueOf(),
            },
            {
              field_key: config.reason,
              field_value: reason,
            },
            {
              field_key: config.operate_node,
              field_value: nodeObj?.name ?? "-",
            },
            {
              field_key: config.start_time,
              field_value: nodeObj?.actual_begin_time
                ? moment(nodeObj?.actual_begin_time).valueOf()
                : 0,
            },
          ],
          config,
          originValue
        ),
      });
    }
  };

  useEffect(() => {
    const curCheckedList = nodeList.filter(
      (i) => !Object.keys(success).includes(i.state_key)
    );
    setNodeList(curCheckedList);
  }, [success]);
  const isMobile = useMemo(() => {
    return props.from === "mobile";
  }, [props.from]);
  if (rollbackRecordLoading) {
    return (
      <Spin
        spinning
        style={{ height: 400, width: "100%", display: "inline-block" }}
      ></Spin>
    );
  }
  return <Spin spinning={loading}>
    <Form
      className={`opt-form-wrap ${isMobile ? "mobile" : "pc"}`}
      getFormApi={setFormApi}
      labelPosition="top"
      labelWidth={120}
      style={{ paddingBottom: 20 }}
    >
      <Row>
        <Col>
          <Form.Slot label={{ text: "选择驳回节点" }}>
            <Skeleton
              loading={listLoading}
              style={{ textAlign: "center" }}
            >
              <div
                className={`checkbox-all ${isMobile ? "checkbox-all-mobile" : "checkbox-all-pc"
                  }`}
              >
                <Checkbox
                  indeterminate={indeterminate}
                  onChange={onCheckAllChange}
                  checked={checkAll}
                  disabled={!nodeList.length}
                >
                  {`全选 （${checkedList.length}/${nodeList.length}）`}
                </Checkbox>
              </div>
              {/*   */}
              <div className={`${isMobile ? "checkbox-group" : ""}`}>
                <Checkbox.Group
                  value={checkedList}
                  onChange={onChange}
                  className={`${isMobile ? "checkbox-group-mobile" : ""}`}
                >
                  {nodeList.map((i) => (
                    <Checkbox
                      key={i.state_key}
                      value={i.state_key}
                      extra={error[i.state_key]}
                    >
                      {i.name}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
            </Skeleton>
          </Form.Slot>
        </Col>
      </Row>
      <Row style={{ marginBottom: 10 }}>
        <Col>
          <Form.TextArea
            autosize
            rows={2}
            maxCount={140}
            field="rollbackReason"
            label="驳回原因"
            placeholder={"请填写节点驳回原因"}
            rules={[{ required: true, message }]}
          />
        </Col>
      </Row>
      {isMobile ? (
        <div>
          <div className="bottom-btn-mobile" style={{ marginTop: 8 }}>
            <Button
              type="primary"
              loading={loading}
              onClick={() => submit()}
              disabled={!nodeList.length}
              block
            >
              提交
            </Button>
          </div>
        </div>
      ) : (
        <div className="bottom-btn-warp">
          <div className="bottom-btn-pc cancel">
            <Button
              type="primary"
              onClick={() => cancel()}
              block={isMobile}
            >
              取消
            </Button>
          </div>
          <div className="bottom-btn-pc">
            <Button
              type="primary"
              loading={loading}
              onClick={() => submit()}
              disabled={!nodeList.length}
              block={isMobile}
            >
              提交
            </Button>
          </div>
        </div>
      )}
    </Form>
  </Spin>
};
export default OptForm;
