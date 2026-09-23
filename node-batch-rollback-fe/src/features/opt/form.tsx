import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Checkbox,
  Spin,
  Skeleton,
  Typography,
} from "@douyinfe/semi-ui";
import moment from "moment";
import { type FormApi } from "@douyinfe/semi-ui/lib/es/form";
import "./index.less";
import {
  submitNodeRollback,
  type WorkflowConfig,
  updateChangeField,
  fetchConfig,
  getSuggestion,
  updateSuggestion,
  getWorkItemFieldDetail,
  type IConfigItem,
  type CompoundValues,
  INodeStatus,
} from "../../api/services";
import sdk from "../../sdk";
import { getMatchedNodeLists } from "./utils";
import { type WorkItemButtonFeatureContext } from "@lark-project/js-sdk";
import { getButtonContext } from "../../utils";

const SEPARATOR = "#&#";

const OptForm = (props) => {
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [conditionCheck, setConditionCheck] = useState(true);
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
  const [originReason, setOriginReason] = useState("");
  const [config, setConfig] = useState<IConfigItem>();
  const [nodeSettingList, setNodeSettingList] = useState<any[]>([]);
  const [buttonContext, setButtonContext] =
    useState<WorkItemButtonFeatureContext>();
  const [rollbackSetting, setRollbackSetting] = useState<any>({
    status: -2,
  });
  const [first, setIsFirst] = useState(0);
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
    setSuggestionLoading(true);
    sdk.Context.load().then(async ({ loginUser }) => {
      const buttonContext =
        (await getButtonContext()) as WorkItemButtonFeatureContext;
      console.info("SDKGetButtonContext", JSON.stringify(buttonContext));
      setButtonContext(buttonContext);
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
          const [configConf, suggestionInfo] = await Promise.all([
            fetchConfig(spaceId),
            getSuggestion(spaceId, id, buttonContext?.nodeId ?? ""),
          ]);
          let _configConf = {} as IConfigItem;
          if (configConf.err_code === 0) {
            _configConf =
              configConf.data.list.filter(
                (i) => i.work_item_type_key === workObjectId
              )?.[0] ?? {};
            setConfig(_configConf);
            if (_configConf.condition) {
              try {
                setNodeSettingList(JSON.parse(_configConf.condition));
              } catch (parseErr) {
                console.error("parse condition failed", parseErr);
              }
            }
            const field = fieldRes?.[0]?.fields?.find(
              (i) => i.field_key === _configConf.rollback_record
            ) ?? {};
            setOriginValue(field.field_value ?? []);
          }

          if (suggestionInfo.err_code === 0) {
            const finishedInfo = suggestionInfo.data.finished_infos?.[0];
            if (finishedInfo) {
              const ownerConclusion =
                finishedInfo.conclusion.owners_finished_conclusion_result?.find(
                  (i) => i.owner === loginUser.id
                );
              const conclusionLabel =
                ownerConclusion?.finished_conclusion_result?.label ??
                finishedInfo.conclusion.finished_conclusion_result?.label ??
                "";

              if (
                _configConf?.work_item_type_key &&
                Object.prototype.hasOwnProperty.call(_configConf, "button_label") &&
                _configConf.button_label
              ) {
                setConditionCheck(
                  conclusionLabel.indexOf(_configConf.button_label) > -1
                );
              }

              const ownerReason =
                finishedInfo.opinion.owners_finished_opinion_result?.find(
                  (i) => i.owner === loginUser.id
                );
              setOriginReason(
                ownerReason?.finished_opinion_result ??
                  finishedInfo.opinion?.finished_opinion_result ??
                  ""
              );
            }
          }
          setSuggestionLoading(false);
        } catch (err) {
          console.error("err", err);
          setSuggestionLoading(false);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (formApi && originReason) {
      formApi.setValue("rollbackReason", originReason);
    }
  }, [formApi, originReason]);

  const message = "该项为必填项";
  const cancel = () => {
    (sdk.containerModal as any).closeModal();
  };

  const submit = () => {
    setIsFirst(1);
    formApi
      ?.validate()
      .then(async (values) => {
        const error = {};
        const success = {};
        let loopNumber = 0;
        let requestList = [...checkedList];
        if (nodeSettingList.length && rollbackSetting.status === 1) {
          requestList = [rollbackSetting.rollbackNodeId];
        }
        requestList.forEach(async (i) => {
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
                await Promise.all([
                  updateOptValue(values.rollbackReason),
                  updateOwnerSuggestion(values.rollbackReason),
                ]);
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
    if (activeWorkItem && config?.reason) {
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
    return Promise.resolve({
      err_code: 0,
      err_msg: "",
      code: 0,
      msg: "",
      data: {},
    });
  };

  const updateOwnerSuggestion = (reason: string) => {
    if (config?.button_label && conditionCheck && activeWorkItem) {
      const { workItemId: id, spaceId } = activeWorkItem;
      return updateSuggestion({
        project_key: spaceId,
        work_item_id: id,
        node_id: activeWorkItem?.nodeId ?? "",
        opinion: reason,
        finished_conclusion_option_key: loginUser,
        operation_type: "owner",
      });
    }
    return Promise.resolve({
      err_code: 0,
      err_msg: "",
      code: 0,
      msg: "",
      data: {},
    });
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

  useEffect(() => {
    if (!buttonContext?.nodeId || workflowList.length === 0) {
      return;
    }
    const { workItemId: id, workObjectId, spaceId, nodeId } = buttonContext;
    sdk.WorkItem.load({
      spaceId,
      workItemId: id,
      workObjectId,
    }).then((res) => {
      if (!res.templateId) {
        return;
      }
      const nodeIdSetting = nodeSettingList.find(
        (item) =>
          item.source?.[0] === String(res.templateId) &&
          item.source?.[1]?.split(SEPARATOR)?.[1] === nodeId
      );

      if (nodeIdSetting) {
        const rollbackNodeId = nodeIdSetting?.target?.split(SEPARATOR)?.[1];
        if (workflowList.find((item) => item.state_key === nodeId)?.status === INodeStatus.Doing) {
          const rollbackNodeName =
            nodeList.find((item) => item.state_key === rollbackNodeId)?.name || "";
          setRollbackSetting(
            rollbackNodeName
              ? {
                  rollbackNodeId,
                  rollbackNodeName,
                  status: 1,
                }
              : { status: -1 }
          );
          return;
        }

        const rollbackNodeName =
          workflowList.find((item) => item.state_key === rollbackNodeId)?.name ||
          "";
        setRollbackSetting(
          rollbackNodeName
            ? {
                rollbackNodeId,
                rollbackNodeName,
                status: 0,
              }
            : { status: -1 }
        );
      } else {
        workflowList.forEach((item) => {
          if (item.source?.[0] === String(res.templateId)) {
            if (item.source?.[1]?.split(SEPARATOR)?.[1] !== nodeId) {
              setRollbackSetting({
                status: -1,
              });
            }
          }
        });
      }
    });
  }, [buttonContext, nodeList, nodeSettingList, workflowList]);

  if (suggestionLoading) {
    return (
      <Spin
        spinning
        style={{ height: 400, width: "100%", display: "inline-block" }}
      ></Spin>
    );
  }
  if (rollbackSetting?.status === 0) {
    return (
      <Typography.Text>
        已完成或未开始的节点无法进行回滚操作
      </Typography.Text>
    );
  }
  if (rollbackSetting?.status === -1 && first === 0) {
    return (
      <Typography.Text>
        当前配置的节点已失效，请重新在后台配置
      </Typography.Text>
    );
  }
  return conditionCheck ? (
    <Spin spinning={loading}>
      <Form
        className={`opt-form-wrap ${isMobile ? "mobile" : "pc"}`}
        getFormApi={setFormApi}
        labelPosition="top"
        labelWidth={120}
        style={{ paddingBottom: 20 }}
      >
        <Row>
          <Col>
            {nodeSettingList.length && rollbackSetting?.status !== -2 ? (
              <Form.Slot label={{ text: "已配置的驳回节点" }}>
                {rollbackSetting.rollbackNodeName}
              </Form.Slot>
            ) : (
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
            )}
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
  ) : (
    <div
      style={{
        height: 200,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginTop: 24,
      }}
    >
      不满足 审批结论名称包含 {config?.button_label} 的使用条件
    </div>
  );
};
export default OptForm;
