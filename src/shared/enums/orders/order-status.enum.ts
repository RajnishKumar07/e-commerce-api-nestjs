export enum OrderStatus {
  /**
   * The order is created but payment is not yet completed.
   * Updated when:
   * - An order is initially created in the database.
   */
  PENDING = 'pending',

  /**
   * The payment for the order failed.
   * Updated when:
   * - Stripe webhook event: `payment_intent.payment_failed`.
   */
  FAILED = 'failed',

  /**
   * The payment for the order is successfully completed.
   * Updated when:
   * - Stripe webhook event: `payment_intent.succeeded`.
   * - Stripe webhook event: `checkout.session.completed`.
   */
  PAID = 'paid',

  /**
   * The order is being prepared for shipment (e.g., packaging, labeling).
   * Updated when:
   * - Manual update by admin or system after payment is confirmed.
   */
  PROCESSING = 'processing',

  /**
   * The order has been shipped and is in transit.
   * Updated when:
   * - Manual update by admin or system after the order is handed over to the shipping carrier.
   */
  SHIPPED = 'shipped',

  /**
   * The order is out for delivery and will reach the customer soon.
   * Updated when:
   * - Shipping carrier updates the status to "out for delivery."
   */
  OUT_FOR_DELIVERY = 'out_for_delivery',

  /**
   * The order has been successfully delivered to the customer.
   * Updated when:
   * - Shipping carrier confirms delivery.
   */
  DELIVERED = 'delivered',

  /**
   * The order has been canceled by the customer or admin.
   * Updated when:
   * - Manual update by admin or system.
   * - Stripe webhook event: `checkout.session.expired` (if applicable).
   */
  CANCELED = 'canceled',

  /**
   * The customer has requested a return for the order.
   * Updated when:
   * - Customer initiates a return request via the UI.
   */
  RETURN_REQUESTED = 'return_requested',

  /**
   * The order has been returned by the customer.
   * Updated when:
   * - Returned items are received and processed.
   */
  RETURNED = 'returned',

  /**
   * The refund for the order has been processed.
   * Updated when:
   * - Stripe webhook event: `charge.refunded`.
   */
  REFUNDED = 'refunded',

  /**
   * The order is temporarily on hold (e.g., due to payment issues, inventory shortages).
   * Updated when:
   * - Manual update by admin or system.
   */
  ON_HOLD = 'on_hold',
}
