/**
 * Database Context Service for AI Voice Assistant
 *
 * This service fetches and formats user-specific database information
 * to provide AI prompts with relevant context for personalized responses.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export class DatabaseContextService {

  /**
   * Fetch comprehensive user context for AI prompts
   */
  static async getUserContext(userId, options = {}) {
    const {
      includeInventory = true,
      includeOrders = true,
      includeCommitments = true,
      includeMarketData = true,
      limit = 'recent' // 'recent', 'all', or number
    } = options;

    try {
      const context = {
        userId,
        timestamp: new Date().toISOString(),
        summary: '',
        details: {}
      };

      // Fetch inventory information
      if (includeInventory) {
        context.details.inventory = await this.getInventoryContext(userId, limit);
      }

      // Fetch order information
      if (includeOrders) {
        context.details.orders = await this.getOrdersContext(userId, limit);
      }

      // Fetch commitment information
      if (includeCommitments) {
        context.details.commitments = await this.getCommitmentsContext(userId, limit);
      }

      // Fetch market data
      if (includeMarketData) {
        context.details.market = await this.getMarketContext();
      }

      // Create context summary
      context.summary = this.createContextSummary(context.details);

      return context;

    } catch (error) {
      console.error('Error fetching user context:', error);
      return {
        userId,
        timestamp: new Date().toISOString(),
        error: 'Unable to fetch context',
        summary: 'No user data available',
        details: {}
      };
    }
  }

  /**
   * Fetch command-specific context
   */
  static async getCommandContext(userId, command, options = {}) {
    switch (command) {
      case 'check_inventory':
        return await this.getInventoryContext(userId, 'all', options);

      case 'check_deliveries':
        return await this.getCommitmentsContext(userId, 'active', options);

      case 'commit_volume':
        return await this.getOrdersContext(userId, 'open', options);

      case 'market_prices':
        return await this.getMarketContext();

      case 'weather_forecast':
        return await this.getWeatherContext();

      default:
        return await this.getUserContext(userId, {
          includeMarketData: command === 'general_query'
        });
    }
  }

  /**
   * Get inventory context for AI
   */
  static async getInventoryContext(userId, limit = 'recent', options = {}) {
    try {
      let query = supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (limit === 'recent') {
        query = query.limit(10);
      } else if (typeof limit === 'number') {
        query = query.limit(limit);
      }

      const { data: inventory, error } = await query;

      if (error) throw error;

      if (!inventory || inventory.length === 0) {
        return {
          hasInventory: false,
          message: "No inventory records found",
          summary: "Zero inventory"
        };
      }

      // Calculate totals and breakdown
      const totalVolume = inventory.reduce((sum, item) => sum + (item.volume_kg || 0), 0);
      const gradeBreakdown = inventory.reduce((grades, item) => {
        const grade = item.grade || 'unknown';
        grades[grade] = (grades[grade] || 0) + (item.volume_kg || 0);
        return grades;
      }, {});

      // Get recent activity
      const recentActivity = inventory.slice(0, 3);

      return {
        hasInventory: true,
        totalVolume,
        gradeBreakdown,
        itemCount: inventory.length,
        recentActivity,
        summary: `${totalVolume}kg total: ${Object.entries(gradeBreakdown)
          .map(([grade, volume]) => `${grade}: ${volume}kg`)
          .join(', ')}`,
        details: inventory
      };

    } catch (error) {
      console.error('Error fetching inventory context:', error);
      return {
        hasInventory: false,
        error: 'Inventory fetch failed',
        summary: "Inventory data unavailable"
      };
    }
  }

  /**
   * Get orders context for AI
   */
  static async getOrdersContext(userId, status = 'open', options = {}) {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by status if specified
      if (status === 'open') {
        query = query.in('status', ['open', 'filled']);
      } else if (status === 'recent') {
        query = query.limit(5);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      if (!orders || orders.length === 0) {
        return {
          hasOrders: false,
          message: "No orders found",
          summary: "No active orders"
        };
      }

      // Analyze orders
      const openOrders = orders.filter(order => order.status === 'open');
      const filledOrders = orders.filter(order => order.status === 'filled');
      const totalVolume = orders.reduce((sum, order) => sum + (order.volume_kg || 0), 0);

      return {
        hasOrders: true,
        totalOrders: orders.length,
        openOrders: openOrders.length,
        filledOrders: filledOrders.length,
        totalVolume,
        recentOrders: orders.slice(0, 3),
        summary: `${openOrders.length} open orders, ${filledOrders.length} filled, total ${totalVolume}kg`,
        details: orders
      };

    } catch (error) {
      console.error('Error fetching orders context:', error);
      return {
        hasOrders: false,
        error: 'Orders fetch failed',
        summary: "Order data unavailable"
      };
    }
  }

  /**
   * Get commitments context for AI
   */
  static async getCommitmentsContext(userId, status = 'active', options = {}) {
    try {
      let query = supabase
        .from('commitments')
        .select(`
          *,
          orders:order_id (order_number, status, processor_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Filter by status if specified
      if (status === 'active') {
        query = query.in('status', ['pending', 'approved', 'ready', 'collected', 'in_transit']);
      } else if (status === 'recent') {
        query = query.limit(5);
      }

      const { data: commitments, error } = await query;

      if (error) throw error;

      if (!commitments || commitments.length === 0) {
        return {
          hasCommitments: false,
          message: "No commitments found",
          summary: "No active commitments"
        };
      }

      // Analyze commitments
      const pendingCommitments = commitments.filter(c => c.status === 'pending');
      const readyCommitments = commitments.filter(c => c.status === 'ready');
      const inTransitCommitments = commitments.filter(c => c.status === 'in_transit');
      const totalCommitted = commitments.reduce((sum, c) => sum + (c.committed_volume_kg || 0), 0);

      return {
        hasCommitments: true,
        totalCommitments: commitments.length,
        pendingCommitments: pendingCommitments.length,
        readyCommitments: readyCommitments.length,
        inTransitCommitments: inTransitCommitments.length,
        totalCommitted,
        recentCommitments: commitments.slice(0, 3),
        summary: `${readyCommitments.length} ready for pickup, ${inTransitCommitments.length} in transit, total ${totalCommitted}kg committed`,
        details: commitments
      };

    } catch (error) {
      console.error('Error fetching commitments context:', error);
      return {
        hasCommitments: false,
        error: 'Commitments fetch failed',
        summary: "Commitment data unavailable"
      };
    }
  }

  /**
   * Get market context for AI
   */
  static async getMarketContext() {
    try {
      // In a real implementation, this would fetch from a market data API
      // For now, we'll provide current market data as context
      const marketData = {
        timestamp: new Date().toISOString(),
        cocoaPrices: {
          gradeA: { price: 3200, trend: 'up', currency: 'USD' },
          gradeB: { price: 2700, trend: 'stable', currency: 'USD' },
          gradeC: { price: 2200, trend: 'down', currency: 'USD' }
        },
        marketStatus: 'Active',
        summary: 'Grade A: $3,200 (↑), Grade B: $2,700 (→), Grade C: $2,200 (↓) per ton'
      };

      return marketData;

    } catch (error) {
      console.error('Error fetching market context:', error);
      return {
        error: 'Market data unavailable',
        summary: 'Market information temporarily unavailable'
      };
    }
  }

  /**
   * Get weather context for AI
   */
  static async getWeatherContext() {
    try {
      // In a real implementation, this would fetch from a weather API
      const weatherData = {
        timestamp: new Date().toISOString(),
        forecast: {
          temperature: { min: 22, max: 28, unit: '°C' },
          rainfall: 'moderate',
          conditions: 'favorable for farming',
          humidity: '75%',
          windSpeed: '10 km/h'
        },
        summary: 'Favorable farming weather: 22-28°C, moderate rain expected'
      };

      return weatherData;

    } catch (error) {
      console.error('Error fetching weather context:', error);
      return {
        error: 'Weather data unavailable',
        summary: 'Weather information temporarily unavailable'
      };
    }
  }

  /**
   * Create formatted context summary for AI prompts
   */
  static createContextSummary(details) {
    const summaryParts = [];

    if (details.inventory?.hasInventory) {
      summaryParts.push(`Inventory: ${details.inventory.summary}`);
    }

    if (details.orders?.hasOrders) {
      summaryParts.push(`Orders: ${details.orders.summary}`);
    }

    if (details.commitments?.hasCommitments) {
      summaryParts.push(`Commitments: ${details.commitments.summary}`);
    }

    if (details.market?.summary) {
      summaryParts.push(`Market: ${details.market.summary}`);
    }

    return summaryParts.join(' | ');
  }

  /**
   * Format context for AI prompt
   */
  static formatContextForPrompt(context, userQuery) {
    const promptParts = [
      `User Context (${new Date(context.timestamp).toLocaleDateString()}):`,
      `Summary: ${context.summary}`
    ];

    // Add relevant details based on query content
    const queryLower = userQuery.toLowerCase();

    if (queryLower.includes('inventory') && context.details.inventory?.hasInventory) {
      promptParts.push(`Inventory Details: ${context.details.inventory.summary}`);
    }

    if (queryLower.includes('order') && context.details.orders?.hasOrders) {
      promptParts.push(`Order Details: ${context.details.orders.summary}`);
    }

    if (queryLower.includes('commit') || queryLower.includes('delivery') && context.details.commitments?.hasCommitments) {
      promptParts.push(`Commitment Details: ${context.details.commitments.summary}`);
    }

    if (queryLower.includes('market') || queryLower.includes('price') && context.details.market) {
      promptParts.push(`Market Details: ${context.details.market.summary}`);
    }

    return promptParts.join('\n');
  }

  /**
   * Create voice-optimized context for concise responses
   */
  static createVoiceOptimizedContext(userId, command, userQuery) {
    return new Promise(async (resolve) => {
      try {
        const context = await this.getCommandContext(userId, command);
        const formattedContext = this.formatContextForPrompt(context, userQuery);

        resolve({
          context,
          formattedPrompt: formattedContext,
          voiceReady: true
        });

      } catch (error) {
        console.error('Error creating voice context:', error);
        resolve({
          context: null,
          formattedPrompt: 'Context unavailable',
          voiceReady: false
        });
      }
    });
  }
}

export default DatabaseContextService;