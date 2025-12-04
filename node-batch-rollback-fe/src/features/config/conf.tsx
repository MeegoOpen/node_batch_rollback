import { Card, Form, Spin, Typography, Toast, Tooltip } from "@douyinfe/semi-ui";
import { FormApi } from "@douyinfe/semi-ui/lib/es/form";
import { IconInfoCircle } from "@douyinfe/semi-icons";
import { debounce } from "lodash";
import React, { memo, useCallback, useEffect, useState, useRef } from "react";
import WorkItemTask from "./WorkObjectTask";
import { fetchConfig, saveConfig } from "../../api/services";
import "./config.less";

const Config = (props: { spaceId: string }) => {
  const { spaceId } = props;
  const [spinning, setSpinning] = useState(true);
  const [formApi, setFormApi] = useState<FormApi>();

  useEffect(() => {
    if (!spaceId || !formApi) {
      return;
    }
    fetchConfig(spaceId)
      .then((res) => {
        if (res) {
          const newList = res.data.list.map((i) => ({
            ...i,
            enable: i.enable === 1 ? true : false,
          }));
          formApi?.setValues(
            {
              list: newList,
            },
            {
              isOverride: true,
            }
          );
        }
      })
      .finally(() => {
        setSpinning(false);
      });
  }, [spaceId, formApi]);

  const debouncedSaveRef = useRef<any>(null);

  const initDebouncedSave = useCallback(() => {
    const saveFunction = debounce(async (values, status) => {
      try {
        const newValues = (values.list ?? []).map((i) => ({
          ...i,
          enable: i.enable === true ? 1 : 0,
        }));
        const res = await saveConfig({ list: newValues, project_key: spaceId });
        if (res.err_code === 0) {
          Toast.success("保存成功");
        } else {
          Toast.error("保存失败");
        }
      } catch (error) {
        console.error("Save failed:", error);
        Toast.error("保存失败");
      } finally {
      }
    }, 800);
    debouncedSaveRef.current = saveFunction;
  }, []);

  useEffect(() => {
    initDebouncedSave();
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [initDebouncedSave]);

  return (
    <div style={{ padding: "0 12px" }}>
      <Spin spinning={spinning}>
        <Card
          style={{ margin: "0 auto", maxWidth: 900 }}
          header={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography.Title heading={4}>
                节点审批场景配置
                <Tooltip
                  title="该配置仅在节点开启了多人确认且使用了“节点结论与意见”巧能时有效,非此场景时,保持条件内容为空即可。"
                >
                  <IconInfoCircle style={{ marginLeft: 8 }} />
                </Tooltip>
              </Typography.Title>
            </div>
          }
        >
          <Form
            className="config-form"
            style={{ width: "100%" }}
            allowEmpty
            labelPosition="left"
            labelAlign="left"
            labelWidth={200}
            getFormApi={setFormApi}
            onChange={({ values, touched }) => {
              if (touched && Object.keys(touched)?.length) {
                debouncedSaveRef.current?.(values);
              }
            }}
          >
            {({ values, formApi }) => (
              <>
                <WorkItemTask
                  spaceId={spaceId}
                  formApi={formApi}
                  refresh={() => {
                    debouncedSaveRef.current?.(values);
                  }}
                />
              </>
            )}
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default memo(Config);
