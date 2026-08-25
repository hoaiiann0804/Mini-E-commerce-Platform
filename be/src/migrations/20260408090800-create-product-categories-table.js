'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    try {
      await queryInterface.addIndex('product_categories', ['product_id']);
    } catch (error) {
      // index might already exist
    }

    try {
      await queryInterface.addIndex('product_categories', ['category_id']);
    } catch (error) {
      // index might already exist
    }

    try {
      await queryInterface.addIndex('product_categories', ['product_id', 'category_id'], {
        unique: true,
      });
    } catch (error) {
      // unique index might already exist
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_categories');
  },
};
