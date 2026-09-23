import React, { useEffect, useState } from "react";
import { Form, Spin, Tooltip } from "@douyinfe/semi-ui";
import { IconAlertTriangle } from "@douyinfe/semi-icons";
import { SEPARATOR } from "./FlowNodeStateTreeSelect";

const getDisabledKeys = (keyMap) => {
  if (Object.prototype.toString.call(keyMap) === "[object Object]") {
    return Object.keys(keyMap);
  }
  return [];
};

const formatOptions = (options, disabledKeyMap, disabledRender) => {
  if (options === undefined) {
    return;
  }
  return options.map((opt) => {
    const {
      children,
      disabled: rawDisabled,
      label: rawLabel,
      key,
      isLeaf,
      ...rest
    } = opt;
    const disabledKeys = getDisabledKeys(disabledKeyMap);
    const disabled =
      isLeaf || !Array.isArray(children) || children.length === 0
        ? rawDisabled || (disabledKeys.length > 0 && disabledKeys.includes(key))
        : false;

    const label =
      disabled && typeof disabledRender === "function"
        ? disabledRender(opt)
        : rawLabel;

    return {
      ...rest,
      key,
      label,
      disabled,
      isLeaf,
      children: formatOptions(
        children,
        disabledKeyMap,
        disabledRender
      ),
    };
  });
};

const defaultRenderSelectedItem = (node) => ({
  isRenderInTag: true,
  content: node?.fullLabel ?? (
    <div>
      <Tooltip content="该选项已失效，请删除">
        <IconAlertTriangle
          style={{
            color: "var(--semi-color-warning)",
            verticalAlign: -4,
            marginRight: 8,
          }}
        />
      </Tooltip>
      <span>{String(node?.key ?? "").split(SEPARATOR)?.[1] ?? node?.label}</span>
    </div>
  ),
});

const updateTreeData = (list, key, children) =>
  (list ?? []).map((node) => {
    if (node.key === key) {
      return { ...node, children };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

const AsyncFormCascaderSelect = (props) => {
  const {
    fetchData,
    onLoadingChange,
    disabledKeyMap,
    disabledRender,
    onChangeByOptions,
    ...rest
  } = props;
  const [treeData, setTreeData] = useState<any[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTreeData(undefined);
    fetchData(1)
      .then((options) => {
        setTreeData(formatOptions(options, disabledKeyMap, disabledRender));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const onLoadData = (selectedOptions = []) => {
    const currentOption = selectedOptions[selectedOptions.length - 1];
    if (!currentOption?.key || currentOption?.children?.length > 0) {
      return Promise.resolve();
    }
    return fetchData(2, {
      value: currentOption.key,
    }).then((options) => {
      setTreeData((origin) =>
        updateTreeData(
          origin,
          currentOption.key,
          formatOptions(options, disabledKeyMap, disabledRender)
        )
      );
    });
  };

  return (
    <Form.Cascader
      renderSelectedItem={defaultRenderSelectedItem}
      {...rest}
      getPopupContainer={() => document.body}
      emptyContent={loading ? <Spin spinning size="small" /> : <div>暂无数据</div>}
      treeData={treeData}
      multiple={false}
      loadData={onLoadData}
      onChange={(value) => {
        if (Array.isArray(value) && value.length === 1) {
          fetchData(2, {
            value: value[0],
          }).then((options) => {
            setTreeData((origin) => updateTreeData(origin, value[0], options));
          });
        }
        if (Array.isArray(value) && value[0]) {
          fetchData(2, {
            value: value[0],
          }).then((options) => {
            onChangeByOptions?.(options);
          });
        }
      }}
    />
  );
};

export default AsyncFormCascaderSelect;
