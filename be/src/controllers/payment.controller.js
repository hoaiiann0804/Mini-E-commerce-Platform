const stripeService = require('../services/payment/stripe.service');
const { Order, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Create payment intent
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', orderId } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      throw new AppError('Invalid amount', 400);
    }

    // Create payment intent with metadata
    //console.log('Creating payment intent with metadata:', {
    //   userId,
    //   orderId: orderId || '',
    // });

    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency,
      metadata: {
        userId,
        orderId: orderId || '',
      },
    });

    //console.log('Payment intent created:', {
    //   id: paymentIntent.paymentIntentId,
    //   metadata: paymentIntent.metadata,
    // });

    res.status(200).json({
      status: 'success',
      data: paymentIntent,
    });
  } catch (error) {
    next(error);
  }
};

// Confirm payment
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      throw new AppError('Payment intent ID is required', 400);
    }

    const paymentIntent =
      await stripeService.confirmPaymentIntent(paymentIntentId);

    //console.log('Payment Intent Retrieved:', {
    //   id: paymentIntent.id,
    //   status: paymentIntent.status,
    //   metadata: paymentIntent.metadata,
    // });

    // Update order payment status if orderId exists in metadata
    if (paymentIntent.metadata.orderId) {
      //console.log('Updating order:', paymentIntent.metadata.orderId);
      //console.log('Payment Intent Status:', paymentIntent.status);

      // First check if order exists
      const existingOrder = await Order.findByPk(
        paymentIntent.metadata.orderId
      );
      // //console.log(
      //   'Existing order found:',
      //   existingOrder
      //     ? {
      //         id: existingOrder.id,
      //         number: existingOrder.number,
      //         currentPaymentStatus: existingOrder.paymentStatus,
      //       }
      //     : 'Order not found'
      // );

      if (existingOrder && paymentIntent.status === 'succeeded') {
        const updateResult = await Order.update(
          {
            status: 'processing', // Cập nhật trạng thái đơn hàng
            paymentStatus: 'paid', // Cập nhật trạng thái thanh toán
            paymentTransactionId: paymentIntent.id,
            paymentProvider: 'stripe',
            updatedAt: new Date(),
          },
          {
            where: { id: paymentIntent.metadata.orderId },
          }
        );
        //console.log('Order update result:', updateResult);

        // Verify the update
        const updatedOrder = await Order.findByPk(
          paymentIntent.metadata.orderId
        );
        // //console.log(
        //   'Order after update:',
        //   updatedOrder
        //     ? {
        //         id: updatedOrder.id,
        //         number: updatedOrder.number,
        //         status: updatedOrder.status, // Trạng thái đơn hàng
        //         paymentStatus: updatedOrder.paymentStatus, // Trạng thái thanh toán
        //         paymentTransactionId: updatedOrder.paymentTransactionId,
        //       }
        //     : 'Order not found after update'
        // );
      } else if (!existingOrder) {
        //console.log('Order not found for ID:', paymentIntent.metadata.orderId);
      } else {
        //console.log('Payment not succeeded, status:', paymentIntent.status);
      }
    } else {
      //console.log('No orderId found in payment intent metadata');
    }

    res.status(200).json({
      status: 'success',
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount:
            paymentIntent.currency === 'vnd'
              ? paymentIntent.amount
              : paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create customer
const createCustomer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      const customer = await stripeService.getCustomer(user.stripeCustomerId);
      return res.status(200).json({
        status: 'success',
        data: { customer },
      });
    }

    // Create new Stripe customer
    const customer = await stripeService.createCustomer({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user.id,
      },
    });

    // Save Stripe customer ID to user
    await user.update({ stripeCustomerId: customer.id });

    res.status(201).json({
      status: 'success',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

// Get payment methods
const getPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || !user.stripeCustomerId) {
      return res.status(200).json({
        status: 'success',
        data: { paymentMethods: [] },
      });
    }

    const paymentMethods = await stripeService.getPaymentMethods(
      user.stripeCustomerId
    );

    res.status(200).json({
      status: 'success',
      data: { paymentMethods },
    });
  } catch (error) {
    next(error);
  }
};

// Create setup intent for saving payment methods
const createSetupIntent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Create customer if doesn't exist
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await user.update({ stripeCustomerId: customerId });
    }

    const setupIntent = await stripeService.createSetupIntent(customerId);

    res.status(200).json({
      status: 'success',
      data: setupIntent,
    });
  } catch (error) {
    next(error);
  }
};

// Handle Stripe webhooks
const handleWebhook = async (req, res, next) => {
  try {
    // For sandbox/development, temporarily skip webhook verification
    //console.log('Webhook received in sandbox mode');
    return res.status(200).json({ received: true });

    // Uncomment below when you have real webhook secret
    // const signature = req.headers['stripe-signature'];
    // const payload = req.body;
    // const event = await stripeService.handleWebhook(payload, signature);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'customer.created':
        //console.log('Customer created:', event.data.object.id);
        break;
      default:
        //console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// Helper function to handle successful payments
const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    if (paymentIntent.metadata.orderId) {
      await Order.update(
        {
          status: 'processing', // Cập nhật trạng thái đơn hàng
          paymentStatus: 'paid', // Cập nhật trạng thái thanh toán
          paymentTransactionId: paymentIntent.id,
          paymentProvider: 'stripe',
        },
        {
          where: { id: paymentIntent.metadata.orderId },
        }
      );
      // //console.log(
      //   `Payment succeeded for order: ${paymentIntent.metadata.orderId}`
      // );
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
};

// Helper function to handle failed payments
const handlePaymentFailed = async (paymentIntent) => {
  try {
    if (paymentIntent.metadata.orderId) {
      await Order.update(
        {
          paymentStatus: 'failed',
          paymentTransactionId: paymentIntent.id,
          paymentProvider: 'stripe',
        },
        {
          where: { id: paymentIntent.metadata.orderId },
        }
      );
      //console.log(
    //     `Payment failed for order: ${paymentIntent.metadata.orderId}`
    //   );
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

// Create refund
const createRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      throw new AppError('Order ID is required', 400);
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.paymentTransactionId) {
      throw new AppError('No payment transaction found for this order', 400);
    }

    const refund = await stripeService.createRefund({
      paymentIntentId: order.paymentTransactionId,
      amount,
      reason,
    });

    // Update order payment status
    await order.update({
      paymentStatus: 'refunded',
    });

    res.status(200).json({
      status: 'success',
      data: { refund },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createCustomer,
  getPaymentMethods,
  createSetupIntent,
  handleWebhook,
  createRefund,
};
