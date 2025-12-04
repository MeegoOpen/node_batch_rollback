package model

import "gorm.io/gorm"

const TableNameNodeOperatorSetting = "node_operation_setting"

// 批量操作节点配置
type NodeOperatorConfig struct {
	gorm.Model
	ProjectKey    string `gorm:"column:project_key"`
	FieldSettings string `gorm:"column:field_settings"` // 驳回记录复合字段配置
	CreatedBy     string `gorm:"column:created_by"`
	UpdatedBy     string `gorm:"column:updated_by"`
	TenantKey     string `gorm:"column:tenant_key"`
}

func NewNodeOperatorConfig() *NodeOperatorConfig {
	return &NodeOperatorConfig{}
}

// TableName TimelineBoard's table name
func (*NodeOperatorConfig) TableName() string {
	return TableNameNodeOperatorSetting
}