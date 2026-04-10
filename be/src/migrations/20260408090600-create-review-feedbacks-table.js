'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('review_feedbacks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      review_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'reviews',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_helpful: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
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
      await queryInterface.addIndex('review_feedbacks', ['review_id']);
    } catch (error) {
      // index might already exist
    }

    try {
      await queryInterface.addIndex('review_feedbacks', ['user_id']);
    } catch (error) {
      // index might already exist
    }

    try {
      await queryInterface.addIndex('review_feedbacks', ['review_id', 'user_id'], {
        unique: true,
      });
    } catch (error) {
      // unique index might already exist
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('review_feedbacks');
  },
};
