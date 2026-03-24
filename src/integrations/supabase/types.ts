export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          available_balance: number
          balance: number
          created_at: string
          currency: string
          id: string
          merchant_id: string
          pending_balance: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency: string
          id?: string
          merchant_id: string
          pending_balance?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string
          pending_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      acquirers: {
        Row: {
          active: boolean
          api_endpoint: string | null
          avg_latency_ms: number | null
          country: string | null
          created_at: string
          id: string
          name: string
          routing_weight: number | null
          success_rate: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          api_endpoint?: string | null
          avg_latency_ms?: number | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          routing_weight?: number | null
          success_rate?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          api_endpoint?: string | null
          avg_latency_ms?: number | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          routing_weight?: number | null
          success_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_notification_emails: {
        Row: {
          created_at: string | null
          email_address: string
          enabled: boolean | null
          id: string
          notify_on_chargeback: boolean | null
          notify_on_failure: boolean | null
          notify_on_high_risk: boolean | null
          notify_on_refund: boolean | null
          notify_on_success: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_address: string
          enabled?: boolean | null
          id?: string
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_high_risk?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string
          enabled?: boolean | null
          id?: string
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_high_risk?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string
          latency_ms: number | null
          merchant_id: string | null
          method: string | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          latency_ms?: number | null
          merchant_id?: string | null
          method?: string | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          latency_ms?: number | null
          merchant_id?: string | null
          method?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          external_account_id: string | null
          iban: string | null
          id: string
          merchant_id: string | null
          provider: string | null
          sort_code: string | null
          status: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          external_account_id?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          provider?: string | null
          sort_code?: string | null
          status?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          external_account_id?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          provider?: string | null
          sort_code?: string | null
          status?: string | null
        }
        Relationships: []
      }
      behavioral_profiles: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          customer_id: string | null
          id: string
          merchant_id: string | null
          mouse_entropy: number | null
          session_duration: number | null
          typing_speed: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          merchant_id?: string | null
          mouse_entropy?: number | null
          session_duration?: number | null
          typing_speed?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          merchant_id?: string | null
          mouse_entropy?: number | null
          session_duration?: number | null
          typing_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      bigcommerce_orders: {
        Row: {
          amount: number | null
          bc_order_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          status: string | null
          store_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount?: number | null
          bc_order_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          store_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number | null
          bc_order_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          store_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bigcommerce_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "bigcommerce_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bigcommerce_orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bigcommerce_stores: {
        Row: {
          access_token: string | null
          active: boolean | null
          id: string
          installed_at: string | null
          merchant_id: string | null
          scope: string | null
          shop_domain: string | null
          store_hash: string
        }
        Insert: {
          access_token?: string | null
          active?: boolean | null
          id?: string
          installed_at?: string | null
          merchant_id?: string | null
          scope?: string | null
          shop_domain?: string | null
          store_hash: string
        }
        Update: {
          access_token?: string | null
          active?: boolean | null
          id?: string
          installed_at?: string | null
          merchant_id?: string | null
          scope?: string | null
          shop_domain?: string | null
          store_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "bigcommerce_stores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      card_velocity: {
        Row: {
          created_at: string
          customer_identifier: string
          id: string
          merchant_id: string
          transaction_count: number
          transaction_date: string
        }
        Insert: {
          created_at?: string
          customer_identifier: string
          id?: string
          merchant_id: string
          transaction_count?: number
          transaction_date?: string
        }
        Update: {
          created_at?: string
          customer_identifier?: string
          id?: string
          merchant_id?: string
          transaction_count?: number
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_velocity_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_wallets: {
        Row: {
          address: string | null
          created_at: string | null
          currency: string | null
          id: string
          merchant_id: string | null
          network: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          network?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          network?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          billing_address: Json | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          merchant_id: string
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          merchant_id: string
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_analytics: {
        Row: {
          browser: string | null
          browser_version: string | null
          created_at: string
          device_id: string
          device_type: string | null
          event_type: string | null
          id: string
          ip_address: string | null
          language: string | null
          merchant_id: string | null
          metadata: Json | null
          os: string | null
          os_version: string | null
          risk_factors: string[] | null
          risk_score: number | null
          screen_resolution: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string
          device_id: string
          device_type?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          os?: string | null
          os_version?: string | null
          risk_factors?: string[] | null
          risk_score?: number | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string
          device_id?: string
          device_type?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          os?: string | null
          os_version?: string | null
          risk_factors?: string[] | null
          risk_score?: number | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_analytics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_reputation: {
        Row: {
          chargebacks: number | null
          created_at: string | null
          device_fingerprint: string | null
          fraud_events: number | null
          id: string
          risk_score: number | null
        }
        Insert: {
          chargebacks?: number | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_events?: number | null
          id?: string
          risk_score?: number | null
        }
        Update: {
          chargebacks?: number | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_events?: number | null
          id?: string
          risk_score?: number | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          amount: number
          chargeflow_id: string | null
          chargeflow_payload: Json | null
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          evidence_due_date: string | null
          id: string
          merchant_id: string
          outcome: string | null
          provider: string | null
          reason: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          chargeflow_id?: string | null
          chargeflow_payload?: Json | null
          created_at?: string
          currency: string
          customer_email?: string | null
          description?: string | null
          evidence_due_date?: string | null
          id?: string
          merchant_id: string
          outcome?: string | null
          provider?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          chargeflow_id?: string | null
          chargeflow_payload?: Json | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          evidence_due_date?: string | null
          id?: string
          merchant_id?: string
          outcome?: string | null
          provider?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          source_service: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          source_service?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          source_service?: string | null
        }
        Relationships: []
      }
      everpay_webhooks: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      fraud_graph_edges: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string | null
          source_node: string | null
          target_node: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_node?: string | null
          target_node?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_node?: string | null
          target_node?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_graph_edges_source_node_fkey"
            columns: ["source_node"]
            isOneToOne: false
            referencedRelation: "fraud_graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_graph_edges_target_node_fkey"
            columns: ["target_node"]
            isOneToOne: false
            referencedRelation: "fraud_graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_graph_nodes: {
        Row: {
          created_at: string | null
          id: string
          node_type: string | null
          node_value: string | null
          risk_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          node_type?: string | null
          node_value?: string | null
          risk_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          node_type?: string | null
          node_value?: string | null
          risk_score?: number | null
        }
        Relationships: []
      }
      fraud_scores: {
        Row: {
          action_taken: string | null
          card_bin: string | null
          created_at: string
          customer_email: string | null
          device_fingerprint: string | null
          device_score: number | null
          geo_score: number | null
          id: string
          ip_address: string | null
          merchant_id: string
          metadata: Json | null
          risk_factors: string[] | null
          risk_level: string | null
          total_score: number | null
          transaction_id: string | null
          velocity_score: number | null
        }
        Insert: {
          action_taken?: string | null
          card_bin?: string | null
          created_at?: string
          customer_email?: string | null
          device_fingerprint?: string | null
          device_score?: number | null
          geo_score?: number | null
          id?: string
          ip_address?: string | null
          merchant_id: string
          metadata?: Json | null
          risk_factors?: string[] | null
          risk_level?: string | null
          total_score?: number | null
          transaction_id?: string | null
          velocity_score?: number | null
        }
        Update: {
          action_taken?: string | null
          card_bin?: string | null
          created_at?: string
          customer_email?: string | null
          device_fingerprint?: string | null
          device_score?: number | null
          geo_score?: number | null
          id?: string
          ip_address?: string | null
          merchant_id?: string
          metadata?: Json | null
          risk_factors?: string[] | null
          risk_level?: string | null
          total_score?: number | null
          transaction_id?: string | null
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_scores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_scores_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          quote_currency: string
          rate: number
          source: string | null
        }
        Insert: {
          base_currency: string
          created_at?: string
          id?: string
          quote_currency: string
          rate: number
          source?: string | null
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          quote_currency?: string
          rate?: number
          source?: string | null
        }
        Relationships: []
      }
      iban_accounts: {
        Row: {
          bank_name: string | null
          bic: string | null
          country: string | null
          created_at: string | null
          iban: string | null
          id: string
          merchant_id: string | null
          status: string | null
        }
        Insert: {
          bank_name?: string | null
          bic?: string | null
          country?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          status?: string | null
        }
        Update: {
          bank_name?: string | null
          bic?: string | null
          country?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          key: string
          merchant_id: string
          response: Json | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          key: string
          merchant_id: string
          response?: Json | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
          merchant_id?: string
          response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          items: Json | null
          merchant_id: string
          notes: string | null
          paid_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json | null
          merchant_id: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json | null
          merchant_id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          account_type: string
          created_at: string | null
          currency: string
          id: string
          merchant_id: string | null
        }
        Insert: {
          account_type: string
          created_at?: string | null
          currency: string
          id?: string
          merchant_id?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string | null
          currency?: string
          id?: string
          merchant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          currency: string
          entry_type: string
          id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          currency: string
          entry_type: string
          id?: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          currency?: string
          entry_type?: string
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidity_pools: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          region: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          region?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          region?: string | null
        }
        Relationships: []
      }
      margin_records: {
        Row: {
          created_at: string | null
          fx_cost: number | null
          id: string
          merchant_fee: number | null
          net_margin: number | null
          processor_fee: number | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          fx_cost?: number | null
          id?: string
          merchant_fee?: number | null
          net_margin?: number | null
          processor_fee?: number | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          fx_cost?: number | null
          id?: string
          merchant_fee?: number | null
          net_margin?: number | null
          processor_fee?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margin_records_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_3ds_settings: {
        Row: {
          auto_enable_high_risk: boolean | null
          created_at: string | null
          decline_threshold: number | null
          enabled: boolean | null
          id: string
          merchant_id: string | null
          risk_threshold: number | null
          skip_if_processor_3ds: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_enable_high_risk?: boolean | null
          created_at?: string | null
          decline_threshold?: number | null
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          risk_threshold?: number | null
          skip_if_processor_3ds?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_enable_high_risk?: boolean | null
          created_at?: string | null
          decline_threshold?: number | null
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          risk_threshold?: number | null
          skip_if_processor_3ds?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_3ds_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_accounts: {
        Row: {
          available_balance: number | null
          currency: string
          id: string
          merchant_id: string | null
          pending_balance: number | null
          reserve_balance: number | null
          updated_at: string | null
        }
        Insert: {
          available_balance?: number | null
          currency: string
          id?: string
          merchant_id?: string | null
          pending_balance?: number | null
          reserve_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          available_balance?: number | null
          currency?: string
          id?: string
          merchant_id?: string | null
          pending_balance?: number | null
          reserve_balance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_acquirer_mids: {
        Row: {
          acquirer_id: string
          active: boolean | null
          created_at: string
          id: string
          merchant_id: string
          mid: string
          priority: number | null
          routing_weight: number | null
        }
        Insert: {
          acquirer_id: string
          active?: boolean | null
          created_at?: string
          id?: string
          merchant_id: string
          mid: string
          priority?: number | null
          routing_weight?: number | null
        }
        Update: {
          acquirer_id?: string
          active?: boolean | null
          created_at?: string
          id?: string
          merchant_id?: string
          mid?: string
          priority?: number | null
          routing_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_acquirer_mids_acquirer_id_fkey"
            columns: ["acquirer_id"]
            isOneToOne: false
            referencedRelation: "acquirers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_acquirer_mids_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_profiles: {
        Row: {
          address: Json | null
          business_name: string | null
          business_type: string | null
          contact_number: string | null
          country: string | null
          created_at: string
          id: string
          industry: string | null
          kyb_verified_at: string | null
          mcc_code: string | null
          merchant_id: string
          onboarding_status: string
          registration_number: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          business_name?: string | null
          business_type?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          kyb_verified_at?: string | null
          mcc_code?: string | null
          merchant_id: string
          onboarding_status?: string
          registration_number?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          business_name?: string | null
          business_type?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          kyb_verified_at?: string | null
          mcc_code?: string | null
          merchant_id?: string
          onboarding_status?: string
          registration_number?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          api_key_hash: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          api_key_hash?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          api_key_hash?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          id: string
          latency_ms: number | null
          provider: string
          response_code: string | null
          response_message: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          id?: string
          latency_ms?: number | null
          provider: string
          response_code?: string | null
          response_message?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          id?: string
          latency_ms?: number | null
          provider?: string
          response_code?: string | null
          response_message?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          merchant_id: string
          metadata: Json | null
          payment_method: string | null
          processor_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id: string
          metadata?: Json | null
          payment_method?: string | null
          processor_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string
          metadata?: Json | null
          payment_method?: string | null
          processor_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_last4: string | null
          card_updater_enabled: boolean | null
          created_at: string
          customer_id: string
          exp_month: string | null
          exp_year: string | null
          id: string
          is_default: boolean
          network_token_status: string | null
          token_last_updated: string | null
          updated_at: string
          vgs_alias: string
        }
        Insert: {
          card_brand?: string | null
          card_last4?: string | null
          card_updater_enabled?: boolean | null
          created_at?: string
          customer_id: string
          exp_month?: string | null
          exp_year?: string | null
          id?: string
          is_default?: boolean
          network_token_status?: string | null
          token_last_updated?: string | null
          updated_at?: string
          vgs_alias: string
        }
        Update: {
          card_brand?: string | null
          card_last4?: string | null
          card_updater_enabled?: boolean | null
          created_at?: string
          customer_id?: string
          exp_month?: string | null
          exp_year?: string | null
          id?: string
          is_default?: boolean
          network_token_status?: string | null
          token_last_updated?: string | null
          updated_at?: string
          vgs_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number | null
          created_at: string | null
          external_id: string | null
          id: string
          merchant_id: string | null
          method: string | null
          processor: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          merchant_id?: string | null
          method?: string | null
          processor?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          merchant_id?: string | null
          method?: string | null
          processor?: string | null
          status?: string | null
        }
        Relationships: []
      }
      processor_fee_profiles: {
        Row: {
          chargeback_fee: number
          created_at: string
          currency: string
          fixed_fee: number
          id: string
          merchant_id: string
          percentage_fee: number
          provider: string
          refund_fee: number
          settlement_days: number
          updated_at: string
        }
        Insert: {
          chargeback_fee?: number
          created_at?: string
          currency?: string
          fixed_fee?: number
          id?: string
          merchant_id: string
          percentage_fee?: number
          provider: string
          refund_fee?: number
          settlement_days?: number
          updated_at?: string
        }
        Update: {
          chargeback_fee?: number
          created_at?: string
          currency?: string
          fixed_fee?: number
          id?: string
          merchant_id?: string
          percentage_fee?: number
          provider?: string
          refund_fee?: number
          settlement_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processor_fee_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      processor_metrics: {
        Row: {
          avg_fee: number | null
          avg_latency: number | null
          id: string
          processor_id: string | null
          region: string | null
          success_rate: number | null
          updated_at: string | null
        }
        Insert: {
          avg_fee?: number | null
          avg_latency?: number | null
          id?: string
          processor_id?: string | null
          region?: string | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_fee?: number | null
          avg_latency?: number | null
          id?: string
          processor_id?: string | null
          region?: string | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          dimensions: Json | null
          id: string
          image_url: string | null
          merchant_id: string
          metadata: Json | null
          name: string
          price: number
          product_type: string | null
          sku: string | null
          stock: number
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          merchant_id: string
          metadata?: Json | null
          name: string
          price?: number
          product_type?: string | null
          sku?: string | null
          stock?: number
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          merchant_id?: string
          metadata?: Json | null
          name?: string
          price?: number
          product_type?: string | null
          sku?: string | null
          stock?: number
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          merchant_id: string
          payload: Json
          provider: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          merchant_id: string
          payload?: Json
          provider: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          merchant_id?: string
          payload?: Json
          provider?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      psp_routes: {
        Row: {
          active: boolean | null
          card_brand: string | null
          country: string | null
          created_at: string | null
          id: string
          merchant_id: string | null
          priority: number | null
          processor: string
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          card_brand?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          priority?: number | null
          processor: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          card_brand?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          priority?: number | null
          processor?: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psp_routes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_reports: {
        Row: {
          created_at: string
          currency: string
          difference: number | null
          id: string
          internal_total: number | null
          merchant_id: string
          metadata: Json | null
          processor_total: number | null
          report_date: string
          status: string
        }
        Insert: {
          created_at?: string
          currency?: string
          difference?: number | null
          id?: string
          internal_total?: number | null
          merchant_id: string
          metadata?: Json | null
          processor_total?: number | null
          report_date?: string
          status?: string
        }
        Update: {
          created_at?: string
          currency?: string
          difference?: number | null
          id?: string
          internal_total?: number | null
          merchant_id?: string
          metadata?: Json | null
          processor_total?: number | null
          report_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_reports_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          merchant_id: string
          provider: string | null
          provider_ref: string | null
          reason: string | null
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          merchant_id: string
          provider?: string | null
          provider_ref?: string | null
          reason?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string
          provider?: string | null
          provider_ref?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reserves: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          merchant_id: string | null
          payment_id: string | null
          release_date: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          payment_id?: string | null
          release_date?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          payment_id?: string | null
          release_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      risk_rules: {
        Row: {
          action: string
          active: boolean
          condition: Json
          created_at: string
          id: string
          merchant_id: string | null
          name: string
          severity: string
        }
        Insert: {
          action?: string
          active?: boolean
          condition?: Json
          created_at?: string
          id?: string
          merchant_id?: string | null
          name: string
          severity?: string
        }
        Update: {
          action?: string
          active?: boolean
          condition?: Json
          created_at?: string
          id?: string
          merchant_id?: string | null
          name?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      rolling_reserves: {
        Row: {
          amount: number
          created_at: string
          currency: string
          held_at: string
          id: string
          merchant_id: string
          release_at: string
          released_at: string | null
          reserve_percent: number
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          held_at?: string
          id?: string
          merchant_id: string
          release_at: string
          released_at?: string | null
          reserve_percent?: number
          status?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          held_at?: string
          id?: string
          merchant_id?: string
          release_at?: string
          released_at?: string | null
          reserve_percent?: number
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rolling_reserves_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rolling_reserves_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_rules: {
        Row: {
          active: boolean
          amount_max: number | null
          amount_min: number | null
          created_at: string
          currency_match: string[] | null
          fallback_provider: string | null
          id: string
          merchant_id: string
          name: string
          priority: number
          target_provider: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_max?: number | null
          amount_min?: number | null
          created_at?: string
          currency_match?: string[] | null
          fallback_provider?: string | null
          id?: string
          merchant_id: string
          name: string
          priority?: number
          target_provider: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_max?: number | null
          amount_min?: number | null
          created_at?: string
          currency_match?: string[] | null
          fallback_provider?: string | null
          id?: string
          merchant_id?: string
          name?: string
          priority?: number
          target_provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_bank_accounts: {
        Row: {
          account_holder_name: string
          account_last4: string
          created_at: string
          currency: string
          id: string
          institution_number: string
          is_default: boolean
          merchant_id: string
          nickname: string | null
          transit_number: string
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_last4: string
          created_at?: string
          currency?: string
          id?: string
          institution_number: string
          is_default?: boolean
          merchant_id: string
          nickname?: string | null
          transit_number: string
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_last4?: string
          created_at?: string
          currency?: string
          id?: string
          institution_number?: string
          is_default?: boolean
          merchant_id?: string
          nickname?: string | null
          transit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_bank_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_batches: {
        Row: {
          created_at: string
          currency: string
          id: string
          processor: string
          settled_at: string | null
          status: string
          total_amount: number
          transaction_count: number
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          processor: string
          settled_at?: string | null
          status?: string
          total_amount?: number
          transaction_count?: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          processor?: string
          settled_at?: string | null
          status?: string
          total_amount?: number
          transaction_count?: number
        }
        Relationships: []
      }
      settlement_instructions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          merchant_id: string | null
          rail: string | null
          settlement_run_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          rail?: string | null
          settlement_run_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          rail?: string | null
          settlement_run_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_instructions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_instructions_settlement_run_id_fkey"
            columns: ["settlement_run_id"]
            isOneToOne: false
            referencedRelation: "settlement_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_runs: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          merchant_count: number | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_count?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_count?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          batch_id: string | null
          created_at: string | null
          currency: string | null
          fee: number | null
          gross_amount: number | null
          id: string
          merchant_id: string | null
          net_amount: number | null
          payment_id: string | null
          processor: string | null
          scheduled_at: string | null
          settled_at: string | null
          settlement_currency: string | null
          status: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          gross_amount?: number | null
          id?: string
          merchant_id?: string | null
          net_amount?: number | null
          payment_id?: string | null
          processor?: string | null
          scheduled_at?: string | null
          settled_at?: string | null
          settlement_currency?: string | null
          status?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          gross_amount?: number | null
          id?: string
          merchant_id?: string | null
          net_amount?: number | null
          payment_id?: string | null
          processor?: string | null
          scheduled_at?: string | null
          settled_at?: string | null
          settlement_currency?: string | null
          status?: string | null
        }
        Relationships: []
      }
      shopify_orders: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          shopify_order_id: string | null
          status: string | null
          store_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          shopify_order_id?: string | null
          status?: string | null
          store_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          shopify_order_id?: string | null
          status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shopify_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_products: {
        Row: {
          created_at: string | null
          id: string
          price: number | null
          shopify_product_id: string | null
          store_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price?: number | null
          shopify_product_id?: string | null
          store_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number | null
          shopify_product_id?: string | null
          store_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shopify_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_stores: {
        Row: {
          access_token: string | null
          auth_tag: string | null
          encrypted_token: string | null
          id: string
          installed_at: string | null
          iv: string | null
          merchant_id: string | null
          scope: string | null
          shop_domain: string | null
          uninstalled: boolean | null
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          auth_tag?: string | null
          encrypted_token?: string | null
          id?: string
          installed_at?: string | null
          iv?: string | null
          merchant_id?: string | null
          scope?: string | null
          shop_domain?: string | null
          uninstalled?: boolean | null
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          auth_tag?: string | null
          encrypted_token?: string | null
          id?: string
          installed_at?: string | null
          iv?: string | null
          merchant_id?: string | null
          scope?: string | null
          shop_domain?: string | null
          uninstalled?: boolean | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_stores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: string
          interval_count: number
          merchant_id: string
          name: string
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          description?: string | null
          id?: string
          interval: string
          interval_count?: number
          merchant_id: string
          name: string
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          interval_count?: number
          merchant_id?: string
          name?: string
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          customer_id: string
          id: string
          payment_method_id: string
          plan_id: string
          status: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          customer_id: string
          id?: string
          payment_method_id: string
          plan_id: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string
          id?: string
          payment_method_id?: string
          plan_id?: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      surcharge_settings: {
        Row: {
          apply_to_credit: boolean | null
          apply_to_debit: boolean | null
          created_at: string | null
          disclosure_text: string | null
          enabled: boolean | null
          fixed_fee: number | null
          id: string
          max_fee_cap: number | null
          merchant_id: string
          percentage_fee: number | null
          updated_at: string | null
        }
        Insert: {
          apply_to_credit?: boolean | null
          apply_to_debit?: boolean | null
          created_at?: string | null
          disclosure_text?: string | null
          enabled?: boolean | null
          fixed_fee?: number | null
          id?: string
          max_fee_cap?: number | null
          merchant_id: string
          percentage_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          apply_to_credit?: boolean | null
          apply_to_debit?: boolean | null
          created_at?: string | null
          disclosure_text?: string | null
          enabled?: boolean | null
          fixed_fee?: number | null
          id?: string
          max_fee_cap?: number | null
          merchant_id?: string
          percentage_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surcharge_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          fx_rate: number | null
          id: string
          idempotency_key: string | null
          merchant_id: string
          metadata: Json | null
          provider: string
          provider_ref: string | null
          settlement_amount: number | null
          settlement_currency: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          customer_email?: string | null
          description?: string | null
          fx_rate?: number | null
          id?: string
          idempotency_key?: string | null
          merchant_id: string
          metadata?: Json | null
          provider: string
          provider_ref?: string | null
          settlement_amount?: number | null
          settlement_currency?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          fx_rate?: number | null
          id?: string
          idempotency_key?: string | null
          merchant_id?: string
          metadata?: Json | null
          provider?: string
          provider_ref?: string | null
          settlement_amount?: number | null
          settlement_currency?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          provider: string | null
          region: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          provider?: string | null
          region?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          provider?: string | null
          region?: string | null
        }
        Relationships: []
      }
      treasury_transfers: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          destination_pool: string | null
          id: string
          source_pool: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          destination_pool?: string | null
          id?: string
          source_pool?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          destination_pool?: string | null
          id?: string
          source_pool?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treasury_transfers_destination_pool_fkey"
            columns: ["destination_pool"]
            isOneToOne: false
            referencedRelation: "liquidity_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treasury_transfers_source_pool_fkey"
            columns: ["source_pool"]
            isOneToOne: false
            referencedRelation: "liquidity_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_type: string
          id: string
          merchant_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_type: string
          id?: string
          merchant_id: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_type?: string
          id?: string
          merchant_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          merchant_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          merchant_id: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          merchant_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt_number: number | null
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          merchant_id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          url: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          merchant_id: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          url: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          merchant_id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_notification_settings: {
        Row: {
          created_at: string | null
          email_address: string
          enabled: boolean | null
          id: string
          merchant_id: string | null
          notify_on_chargeback: boolean | null
          notify_on_failure: boolean | null
          notify_on_refund: boolean | null
          notify_on_success: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_address: string
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_notification_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "merchant"
        | "reseller"
        | "super_admin"
        | "agent"
        | "investor"
        | "developer"
        | "secops"
        | "support"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "merchant",
        "reseller",
        "super_admin",
        "agent",
        "investor",
        "developer",
        "secops",
        "support",
      ],
    },
  },
} as const
