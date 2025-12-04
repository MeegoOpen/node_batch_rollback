package dao

import (
	"context"
	"errors"
	"node_operator_standalone/internal/model"
	"node_operator_standalone/pkg/database"

	"gorm.io/gorm"
)

type NodeOperatorConfigDao struct {
	db *gorm.DB
}

func NewNodeOperatorConfigDao() *NodeOperatorConfigDao {
	return &NodeOperatorConfigDao{
		db: database.GetDB(),
	}
}

func (d *NodeOperatorConfigDao) QueryConfigByProjectKey(ctx context.Context, projectKey string) (*model.NodeOperatorConfig, error) {
	var config model.NodeOperatorConfig
	res := d.db.WithContext(ctx).Where("project_key = ?", projectKey).First(&config)
	if res.Error != nil && !errors.Is(res.Error, gorm.ErrRecordNotFound) {
		return nil, res.Error
	}
	return &config, nil
}

func (d *NodeOperatorConfigDao) UpdateOrSaveConfig(ctx context.Context, config *model.NodeOperatorConfig) error {
	// Check if a config with the given project_key already exists
	var existingConfig model.NodeOperatorConfig
	result := d.db.WithContext(ctx).Where("project_key = ?", config.ProjectKey).First(&existingConfig)

	if result.Error == nil {
		// Update existing config
		return d.db.WithContext(ctx).Model(&existingConfig).Updates(config).Error
	}

	if result.Error == gorm.ErrRecordNotFound {
		// Create new config
		return d.db.WithContext(ctx).Create(config).Error
	}

	return result.Error
}
