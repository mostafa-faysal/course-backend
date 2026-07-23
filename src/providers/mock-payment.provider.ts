export class MockPaymentProvider {
  /**
   * Simulates a payment processing delay and result based on the provided success flag.
   * In a real-world scenario, this would communicate with Stripe, PayPal, etc.
   */
  static async processPayment(orderId: string, amount: number, success: boolean): Promise<{ status: 'SUCCESS' | 'FAILED'; transactionId: string | null }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (success) {
      return {
        status: 'SUCCESS',
        transactionId: `txn_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      };
    } else {
      return {
        status: 'FAILED',
        transactionId: null,
      };
    }
  }
}
