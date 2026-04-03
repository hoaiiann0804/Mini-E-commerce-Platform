const Stripe = require('stripe');
const https = require('https');
const dns = require('dns');
const { AppError } = require('../../middlewares/errorHandler');

// Force IPv4 DNS resolution via resolve4 to bypass getaddrinfo/DNS issues in some Docker setups
const ipv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const opts = options || {};
  const wantAll = opts.all === true;

  dns.resolve4(hostname, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses || addresses.length === 0) {
      return callback(new Error(`No A records for ${hostname}`));
    }

    if (wantAll) {
      const records = addresses.map((address) => ({ address, family: 4 }));
      return callback(null, records);
    }

    return callback(null, addresses[0], 4);
  });
};

const httpAgent = new https.Agent({ lookup: ipv4Lookup });

// Initialize Stripe with secret key and a custom HTTP client that uses our agent
const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  httpAgent,
  httpClient: Stripe.createNodeHttpClient(httpAgent),
});

// Temporarily override dns.lookup during Stripe calls to bypass getaddrinfo issues
const withDnsLookupOverride = async (fn) => {
  const originalLookup = dns.lookup;
  dns.lookup = ipv4Lookup;
  try {
    return await fn();
  } finally {
    dns.lookup = originalLookup;
  }
};

class StripeService {
  /**
   * Create a payment intent for checkout
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Amount in cents
   * @param {string} params.currency - Currency code (default: 'usd')
   * @param {Object} params.metadata - Additional metadata
   * @returns {Object} Payment intent object
   */
  async createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
    try {
      const stripeAmount =
        currency === 'vnd' ? Math.round(amount) : Math.round(amount * 100);

      console.log('Creating Stripe payment intent with params:', {
        amount: stripeAmount,
        currency,
        metadata,
        originalAmount: amount,
      });

      const paymentIntent = await withDnsLookupOverride(() =>
        stripe.paymentIntents.create({
          amount: stripeAmount, // VND doesn't use decimals
          currency,
          metadata,
          automatic_payment_methods: {
            enabled: true,
          },
        })
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe createPaymentIntent error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        statusCode: error.statusCode,
      });
      throw new AppError(
        `Failed to create payment intent: ${error.message}`,
        500
      );
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Object} Payment intent object
   */
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await withDnsLookupOverride(() =>
        stripe.paymentIntents.retrieve(paymentIntentId)
      );
      return paymentIntent;
    } catch (error) {
      console.error('Stripe confirmPaymentIntent error:', error);
      throw new AppError('Failed to confirm payment intent', 500);
    }
  }

  /**
   * Create a customer
   * @param {Object} params - Customer parameters
   * @param {string} params.email - Customer email
   * @param {string} params.name - Customer name
   * @param {Object} params.metadata - Additional metadata
   * @returns {Object} Customer object
   */
  async createCustomer({ email, name, metadata = {} }) {
    try {
      const customer = await withDnsLookupOverride(() =>
        stripe.customers.create({
          email,
          name,
          metadata,
        })
      );

      return customer;
    } catch (error) {
      console.error('Stripe createCustomer error:', error);
      throw new AppError('Failed to create customer', 500);
    }
  }

  /**
   * Retrieve a customer
   * @param {string} customerId - Customer ID
   * @returns {Object} Customer object
   */
  async getCustomer(customerId) {
    try {
      const customer = await withDnsLookupOverride(() =>
        stripe.customers.retrieve(customerId)
      );
      return customer;
    } catch (error) {
      console.error('Stripe getCustomer error:', error);
      throw new AppError('Failed to retrieve customer', 500);
    }
  }

  /**
   * Create a refund
   * @param {Object} params - Refund parameters
   * @param {string} params.paymentIntentId - Payment intent ID
   * @param {number} params.amount - Amount to refund in cents (optional, full refund if not provided)
   * @param {string} params.reason - Refund reason
   * @returns {Object} Refund object
   */
  async createRefund({
    paymentIntentId,
    amount,
    reason = 'requested_by_customer',
  }) {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
        reason,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await withDnsLookupOverride(() =>
        stripe.refunds.create(refundData)
      );
      return refund;
    } catch (error) {
      console.error('Stripe createRefund error:', error);
      throw new AppError('Failed to create refund', 500);
    }
  }

  /**
   * Handle webhook events
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Event object
   */
  async handleWebhook(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return event;
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw new AppError('Invalid webhook signature', 400);
    }
  }

  /**
   * Get payment methods for a customer
   * @param {string} customerId - Customer ID
   * @returns {Array} Payment methods array
   */
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await withDnsLookupOverride(() =>
        stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        })
      );

      return paymentMethods.data;
    } catch (error) {
      console.error('Stripe getPaymentMethods error:', error);
      throw new AppError('Failed to retrieve payment methods', 500);
    }
  }

  /**
   * Create a setup intent for saving payment methods
   * @param {string} customerId - Customer ID
   * @returns {Object} Setup intent object
   */
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await withDnsLookupOverride(() =>
        stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
        })
      );

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      };
    } catch (error) {
      console.error('Stripe createSetupIntent error:', error);
      throw new AppError('Failed to create setup intent', 500);
    }
  }
}

module.exports = new StripeService();
