package service

import (
	"context"
	"encoding/json"
	"log"
	"node_operator_standalone/internal/dao"
	"node_operator_standalone/internal/model"
)

// NodeOperatorSettings represents the configuration settings for node operations
type NodeOperatorSettings struct {
	Enable          int8   `json:"enable,omitempty"`
	ButtonLabel     string `json:"button_label,omitempty"`
	RollbackRecord  string `json:"rollback_record,omitempty"`
	Operator        string `json:"operator,omitempty"`
	Reason          string `json:"reason,omitempty"`
	OperateTime     string `json:"operate_time,omitempty"`
	OperateNode     string `json:"operate_node,omitempty"`
	StartTime       string `json:"start_time,omitempty"`
	WorkItemTypeKey string `json:"work_item_type_key,omitempty"`
	Condition       string `json:"condition,omitempty"`
}

type SaveConfigReq struct {
	ProjectKey string                  `json:"project_key"`
	List       []*NodeOperatorSettings `json:"list"`
	UserKey    string                  `json:"user_key"`
	TenantKey  string                  `json:"tenant_key"`
}

type QueryConfigResp struct {
	ProjectKey string                  `json:"project_key"`
	List       []*NodeOperatorSettings `json:"list"`
}

type ConfigService struct {
	dao *dao.NodeOperatorConfigDao
}

func NewConfigService() *ConfigService {
	return &ConfigService{
		dao: dao.NewNodeOperatorConfigDao(),
	}
}

func (s *ConfigService) SaveConfig(ctx context.Context, req *SaveConfigReq) error {
	log.Printf("start to save node operator config for project: %s", req.ProjectKey)

	cfg := &model.NodeOperatorConfig{
		ProjectKey: req.ProjectKey,
		CreatedBy:  req.UserKey,
		UpdatedBy:  req.UserKey,
		TenantKey:  req.TenantKey,
	}

	if req.List != nil {
		fieldSettingStr, err := json.Marshal(req.List)
		if err != nil {
			log.Printf("failed to marshal fieldSetting: %+v", err)
			return err
		}
		cfg.FieldSettings = string(fieldSettingStr)
	}

	err := s.dao.UpdateOrSaveConfig(ctx, cfg)
	if err != nil {
		log.Printf("save node operator config failed: %+v", err)
		return err
	}

	return nil
}

func (s *ConfigService) QueryConfig(ctx context.Context, projectKey string) (*QueryConfigResp, error) {
	log.Printf("start to query node operator config for project: %s", projectKey)

	config, err := s.dao.QueryConfigByProjectKey(ctx, projectKey)
	if err != nil {
		log.Printf("query node operator config failed: %+v", err)
		return nil, err
	}

	resp := &QueryConfigResp{
		ProjectKey: config.ProjectKey,
	}

	list := make([]*NodeOperatorSettings, 0)
	if config.FieldSettings != "" {
		err := json.Unmarshal([]byte(config.FieldSettings), &list)
		if err != nil {
			log.Printf("failed to unmarshal fieldSetting: %s", err)
			// Decide if you want to return an error or an empty list
		}
	}
	resp.List = list

	return resp, nil
}
