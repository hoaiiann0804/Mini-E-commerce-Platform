const logger = require('../../utils/logger');

/**
 * Service để log các hoạt động của admin
 * Giúp audit và monitor các thay đổi quan trọng
 */
class AdminAuditService {
  /**
   * Log hoạt động CRUD trên user
   */
  static logUserAction(adminUser, action, targetUserId, changes = {}) {
    if (!adminUser) {
      console.error('AdminAuditService.logUserAction: adminUser is undefined');
      return;
    }

    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      targetUserId,
      changes,
      timestamp: new Date().toISOString(),
      ip: null, // Sẽ được set từ req.ip
    };

    logger.info('ADMIN_USER_ACTION', logData);
  }

  /**
   * Log hoạt động CRUD trên product
   */
  static logProductAction(
    adminUser,
    action,
    productId,
    productName,
    changes = {}
  ) {
    if (!adminUser) {
      console.error(
        'AdminAuditService.logProductAction: adminUser is undefined'
      );
      return;
    }

    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      productId,
      productName,
      changes,
      timestamp: new Date().toISOString(),
      ip: null,
    };

    logger.info('ADMIN_PRODUCT_ACTION', logData);
  }

  /**
   * Log hoạt động trên order
   */
  static logOrderAction(adminUser, action, orderId, orderCode, changes = {}) {
    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      orderId,
      orderCode,
      changes,
      timestamp: new Date().toISOString(),
      ip: null,
    };

    logger.info('ADMIN_ORDER_ACTION', logData);
  }

  /**
   * Log hoạt động xóa review
   */
  static logReviewAction(adminUser, action, reviewId, userId, productId) {
    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      reviewId,
      userId,
      productId,
      timestamp: new Date().toISOString(),
      ip: null,
    };

    logger.info('ADMIN_REVIEW_ACTION', logData);
  }

  /**
   * Log việc truy cập dashboard và thống kê
   */
  static logDashboardAccess(adminUser, endpoint, filters = {}) {
    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action: 'DASHBOARD_ACCESS',
      endpoint,
      filters,
      timestamp: new Date().toISOString(),
      ip: null,
    };

    logger.info('ADMIN_DASHBOARD_ACCESS', logData);
  }

  /**
   * Log failed authentication attempts
   */
  static logFailedAuth(email, reason, ip) {
    const logData = {
      email,
      reason,
      timestamp: new Date().toISOString(),
      ip,
    };

    logger.warn('ADMIN_AUTH_FAILED', logData);
  }

  /**
   * Log successful login
   */
  static logSuccessfulLogin(adminUser, ip) {
    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action: 'LOGIN_SUCCESS',
      timestamp: new Date().toISOString(),
      ip,
    };

    logger.info('ADMIN_LOGIN_SUCCESS', logData);
  }
}

/**
 * Middleware để thêm IP vào audit logs
 */
const auditMiddleware = (req, res, next) => {
  // Override audit methods để include IP
  const originalLogUserAction = AdminAuditService.logUserAction;
  const originalLogProductAction = AdminAuditService.logProductAction;
  const originalLogOrderAction = AdminAuditService.logOrderAction;
  const originalLogReviewAction = AdminAuditService.logReviewAction;
  const originalLogDashboardAccess = AdminAuditService.logDashboardAccess;

  AdminAuditService.logUserAction = (
    adminUser,
    action,
    targetUserId,
    changes = {}
  ) => {
    if (!adminUser) {
      console.error('AdminAuditService.logUserAction: adminUser is undefined');
      return;
    }

    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      targetUserId,
      changes,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };
    logger.info('ADMIN_USER_ACTION', logData);
  };

  AdminAuditService.logProductAction = (
    adminUser,
    action,
    productId,
    productName,
    changes = {}
  ) => {
    if (!adminUser) {
      console.error(
        'AdminAuditService.logProductAction: adminUser is undefined'
      );
      return;
    }

    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      productId,
      productName,
      changes,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };
    logger.info('ADMIN_PRODUCT_ACTION', logData);
  };

  AdminAuditService.logOrderAction = (
    adminUser,
    action,
    orderId,
    orderCode,
    changes = {}
  ) => {
    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      orderId,
      orderCode,
      changes,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };
    logger.info('ADMIN_ORDER_ACTION', logData);
  };

  AdminAuditService.logReviewAction = (
    adminUser,
    action,
    reviewId,
    userId,
    productId
  ) => {
    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action,
      reviewId,
      userId,
      productId,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };
    logger.info('ADMIN_REVIEW_ACTION', logData);
  };

  AdminAuditService.logDashboardAccess = (
    adminUser,
    endpoint,
    filters = {}
  ) => {
    const logData = {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action: 'DASHBOARD_ACCESS',
      endpoint,
      filters,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };
    logger.info('ADMIN_DASHBOARD_ACCESS', logData);
  };

  // Restore original methods after request
  res.on('finish', () => {
    AdminAuditService.logUserAction = originalLogUserAction;
    AdminAuditService.logProductAction = originalLogProductAction;
    AdminAuditService.logOrderAction = originalLogOrderAction;
    AdminAuditService.logReviewAction = originalLogReviewAction;
    AdminAuditService.logDashboardAccess = originalLogDashboardAccess;
  });

  next();
};

module.exports = {
  AdminAuditService,
  auditMiddleware,
};
