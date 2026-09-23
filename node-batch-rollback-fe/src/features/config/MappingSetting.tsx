import React, { useCallback, useMemo, useState } from "react";
import { ArrayField, Button } from "@douyinfe/semi-ui";
import MappingSettingRow from "./MappingSettingRow";
import sdk from "../../sdk";

const MappingSetting = ({ field, spaceId, formApi }) => {
  const selectedNodeKeys = formApi?.getValue(`${field}.condition`) ?? [];
  const [allTemplateList, setAllTemplateList] = useState<any[]>([]);

  const disabledKeyMap = useMemo(() => {
    const map = {};
    selectedNodeKeys?.forEach((item) => {
      const sourceSecondItem = item?.source?.[1];
      if (sourceSecondItem) {
        map[sourceSecondItem] = true;
      }
    });
    return map;
  }, [selectedNodeKeys]);

  const workObjId = formApi?.getValue(`${field}.work_item_type_key`);
  const getAllTemplateList = useCallback(async () => {
    if (allTemplateList.length > 0) {
      return allTemplateList;
    }
    const res = await sdk.WorkObject.load({
      spaceId,
      workObjectId: workObjId,
    });
    const templateList = (await res.getTemplateList()).filter(
      (item) => item.disabled === false
    );
    setAllTemplateList(templateList);
    return templateList;
  }, [allTemplateList, spaceId, workObjId]);

  return (
    <div className="mapping-setting">
      <ArrayField field={`${field}.condition`}>
        {({ arrayFields, addWithInitValue }) => (
          <>
            <Button
              className="mapping-setting-add"
              onClick={() => addWithInitValue({})}
              disabled={!workObjId}
            >
              添加节点规则
            </Button>
            {arrayFields.map((arrayField) => (
              <div key={arrayField.key} className="mapping-setting-row">
                <MappingSettingRow
                  arrayField={arrayField}
                  spaceId={spaceId}
                  formApi={formApi}
                  workObjId={workObjId}
                  disabledKeyMap={disabledKeyMap}
                  getAllTemplateList={getAllTemplateList}
                />
              </div>
            ))}
          </>
        )}
      </ArrayField>
    </div>
  );
};

export default MappingSetting;
