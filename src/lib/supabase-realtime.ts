import { supabase } from './supabase.js';

const ORDERS_CHANNEL = 'orders-realtime';

/**
 * Broadcast new order event to all connected clients via Supabase Realtime
 */
export async function broadcastNewOrder(orderData: any): Promise<void> {
  try {
    const channel = supabase.channel(ORDERS_CHANNEL);
    
    await channel.send({
      type: 'broadcast',
      event: 'new-order',
      payload: {
        order: orderData,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Supabase Realtime: Broadcasted new order:', orderData.id);
  } catch (error) {
    console.error('❌ Supabase Realtime: Error broadcasting new order:', error);
  }
}

/**
 * Broadcast order status update to all connected clients via Supabase Realtime
 */
export async function broadcastOrderStatusUpdate(
  orderData: any,
  previousStatus: string,
  newStatus: string
): Promise<void> {
  try {
    const channel = supabase.channel(ORDERS_CHANNEL);
    
    await channel.send({
      type: 'broadcast',
      event: 'order-status-updated',
      payload: {
        order: orderData,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Supabase Realtime: Broadcasted order status update:', orderData.id);
  } catch (error) {
    console.error('❌ Supabase Realtime: Error broadcasting order update:', error);
  }
}

/**
 * Broadcast shift summary update to all connected clients via Supabase Realtime
 */
export async function broadcastShiftSummaryUpdate(shiftSummaryData: any): Promise<void> {
  try {
    const channel = supabase.channel(ORDERS_CHANNEL);
    
    await channel.send({
      type: 'broadcast',
      event: 'shift-summary-updated',
      payload: {
        shiftSummary: shiftSummaryData,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Supabase Realtime: Broadcasted shift summary update');
  } catch (error) {
    console.error('❌ Supabase Realtime: Error broadcasting shift summary update:', error);
  }
}

